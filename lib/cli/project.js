import fs from 'fs';
import path from 'path';
import dedent from 'dedent-js';
import nsp from 'nsp';
import broccoli from 'broccoli';
import rimraf from 'rimraf';
import ora from 'ora';
import printSlowNodes from 'broccoli-slow-trees';
import { sync as copyDereferenceSync } from 'copy-dereference';
import chalk from 'chalk';
import MergeTree from 'broccoli-merge-trees';
import Funnel from 'broccoli-funnel';
import createDebug from 'debug';
import noop from 'lodash/noop';
import ui from './ui';
import Builder from './builder';
import Watcher from './watcher';
import tryRequire from '../utils/try-require';
import isDir from '../utils/is-dir';

const debug = createDebug('denali:project');

export default class Project {

  builders = new Map();

  constructor(options = {}) {
    this.environment = options.environment || 'development';
    this.printSlowTrees = options.printSlowTrees || false;
    this.dir = options.dir || process.cwd();
    this.pkg = require(path.join(this.dir, 'package.json'));
    this.lint = options.lint;
    this.audit = options.audit;
    this.buildDummy = options.buildDummy;

    debug(`creating project for ${ this.dir }`);

    this.pkg = require(path.join(this.dir, 'package.json'));
  }

  get isAddon() {
    return this.pkg.keywords && this.pkg.keywords.includes('denali-addon');
  }

  getBuilderAndTree() {
    if (this.isAddon && this.buildDummy) {
      debug(`building ${ this.pkg.name } as dummy app`);
      let dummyBuilder = Builder.createFor(path.join(this.dir, 'test', 'dummy'), this, [ this.dir ]);
      let addonBuilder = Builder.createFor(this.dir, this);
      let dummyTree = dummyBuilder.toTree();
      let addonTree = addonBuilder.toTree();
      let addonTests = new Funnel(addonTree, {
        include: [ 'test/**/*' ],
        exclude: [ 'test/dummy/**/*' ]
      });
      addonTree = new Funnel(addonTree, {
        exclude: [ 'test/**/*' ],
        destDir: path.join('node_modules', this.pkg.name)
      });
      this.rootBuilder = addonBuilder;
      return {
        builder: addonBuilder,
        tree: new MergeTree([ addonTree, dummyTree, addonTests ], { overwrite: true })
      };
    }
    debug(`building ${ this.pkg.name } as root`);
    this.rootBuilder = Builder.createFor(this.dir, this);
    return {
      builder: this.rootBuilder,
      tree: this.rootBuilder.toTree()
    };
  }

  build(outputDir = 'dist') {
    debug('building project');
    if (!path.isAbsolute(outputDir)) {
      outputDir = path.join(process.cwd(), outputDir);
    }
    this.startTime = process.hrtime();
    let broccoliBuilder = new broccoli.Builder(this.getBuilderAndTree().tree);
    let spinner = ora(`Building ${ this.pkg.name }`).start();
    let start = process.hrtime();
    return broccoliBuilder.build()
      .then((results) => {
        this._finishBuild(results, outputDir);
      }).finally(() => {
        return broccoliBuilder.cleanup();
      }).finally(() => {
        let [ sec, ns ] = process.hrtime(start);
        let elapsed = (sec + (ns / 1e9)).toFixed(3);
        spinner.text = `${ this.pkg.name } build complete (${ elapsed }s)`;
        spinner.succeed();
        spinner.stop();
      }).then(() => {
        return outputDir;
      }).catch((err) => {
        if (err.file) {
          ui.error(`File: ${ err.file }`);
        }
        ui.error(err.stack);
        ui.error('\nBuild failed');
        throw err;
      });
  }

  watch({ outputDir, beforeRebuild, onBuild }) {
    outputDir = outputDir || 'dist';
    onBuild = onBuild || noop;
    let start = process.hrtime();
    if (fs.existsSync(outputDir)) {
      rimraf.sync(outputDir);
    }
    let { builder, tree } = this.getBuilderAndTree();
    let broccoliBuilder = new broccoli.Builder(tree);
    let watcher = new Watcher(broccoliBuilder, { beforeRebuild, interval: 100 });

    // Watch/build any child addons under development
    onBuild = this.watchInDevelopmentChildAddons(builder.childBuilders, onBuild);

    let onExit = () => {
      broccoliBuilder.cleanup();
      process.exit(1);
    };
    process.on('SIGINT', onExit);
    process.on('SIGTERM', onExit);

    let spinner = ora(`Building ${ this.pkg.name }`).start();
    watcher.on('buildstart', () => {
      debug('changes detected, rebuilding');
      spinner = ora('Building').start();
      start = process.hrtime();
    });
    watcher.on('change', (results) => {
      debug('rebuild finished, wrapping up');
      this._finishBuild(results, outputDir);
      let [ sec, ns ] = process.hrtime(start);
      let elapsed = (sec + (ns / 1e9)).toFixed(3);
      spinner.text = `${ this.pkg.name } build complete (${ elapsed }s)`;
      spinner.succeed();
      onBuild(this);
    });

    watcher.on('error', (error) => {
      spinner.stop();
      ui.error('\n\nBuild failed.');
      if (error.file) {
        if (error.line && error.column) {
          ui.error(`File: ${ error.treeDir }/${ error.file }:${ error.line }:${ error.column }`);
        } else {
          ui.error(`File: ${ error.treeDir }/${ error.file }`);
        }
      }
      if (error.message) {
        ui.error(`Error: ${ error.message }`);
      }
      if (error.stack) {
        ui.error(`Stack trace:\n${ error.stack.replace(/(^.)/mg, '  $1') }`);
      }
    });
  }

  createApplication() {
    return this.build().then((outputDir) => {
      let Application = tryRequire(path.join(outputDir, 'app', 'application'));
      if (!Application) {
        throw new Error('Denali was unable to load app/application.js.');
      }
      return new Application({
        dir: outputDir,
        environment: this.environment
      });
    }).catch((error) => {
      ui.error(error.stack);
      throw error;
    });
  }

  watchInDevelopmentChildAddons(childBuilders, onBuild) {
    // Find child addons that are flagged as "in development"
    let inDevelopmentAddons = childBuilders.filter((childBuilder) => {
      return childBuilder.isDevelopingAddon && fs.lstatSync(childBuilder.dir).isSymbolicLink();
    });

    let initialBuild = new Map();
    if (inDevelopmentAddons.length > 0) {
      let originalOnBuild = onBuild;
      onBuild = function onBuildWithChildren(project) {
        // Hold initial server spawn until all child addons have built
        if (!initialBuild.has(project)) {
          initialBuild.set(project, true);
        }
        // Once all child addons and app have built the first time, then trigger restart for each rebuild
        if (initialBuild.size === inDevelopmentAddons.length + 1) {
          originalOnBuild();
        }
      };

      inDevelopmentAddons.forEach((childBuilder) => {
        let addonDist = fs.realpathSync(childBuilder.dir);
        debug(`"${ childBuilder.pkg.name }" (${ addonDist }) addon is under development, creating a project to watch & compile it`);
        let addonPackageDir = path.dirname(addonDist);
        let addonProject = new Project({
          environment: this.environment,
          dir: addonPackageDir,
          lint: this.lint,
          audit: this.audit
        });
        addonProject.watch({ onBuild, outputDir: addonDist });
      });
    }

    return onBuild;
  }

  _finishBuild(results, outputDir) {
    rimraf.sync(outputDir);
    copyDereferenceSync(results.directory, outputDir);
    if (this.printSlowTrees) {
      printSlowNodes(results.graph);
    }
    if (this.audit) {
      let pkg = path.join(this.dir, 'package.json');
      nsp.check({ package: pkg }, (err, vulnerabilities) => {
        if (err && [ 'ENOTFOUND', 'ECONNRESET' ].includes(err.code)) {
          ui.warn('Error trying to scan package dependencies for vulnerabilities with nsp, unable to reach server. Skipping scan ...');
          ui.warn(err);
        }
        if (vulnerabilities && vulnerabilities.length > 0) {
          vulnerabilities = vulnerabilities.filter((vulnerability) => {
            return !this.rootBuilder.ignoreVulnerabilities.find((ignorePattern) => {
              return vulnerability.path.join('|').indexOf(ignorePattern.join('|')) > -1;
            });
          });
          if (vulnerabilities.length > 0) {
            ui.warn('WARNING: Some packages in your package.json may have security vulnerabilities:');
            vulnerabilities.forEach((item) => {
              let dependencyPath = item.path.join(' => ');
              let module = `*** ${ item.module }@${ item.version } ***`;
              let recommendation = (item.recommendation || '').replace(/\n/g, ' ');
              let message = dedent`${ chalk.bold.yellow(module) }
                                    Found in: ${ dependencyPath }
                                    Recommendation: ${ chalk.reset.cyan(recommendation) }`;
              ui.raw('warn', `${ message }\n`);
            });
          }
        }
      });
    }
  }

}
