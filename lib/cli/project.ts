import * as fs from 'fs';
import * as path from 'path';
import * as dedent from 'dedent-js';
import nsp from 'nsp';
import broccoli from 'broccoli';
import * as rimraf from 'rimraf';
import printSlowNodes from 'broccoli-slow-trees';
import { sync as copyDereferenceSync } from 'copy-dereference';
import * as chalk from 'chalk';
import MergeTree from 'broccoli-merge-trees';
import Funnel from 'broccoli-funnel';
import * as createDebug from 'debug';
import {
  noop,
  after,
  dropWhile,
  takeWhile
} from 'lodash';
import * as semver from 'semver';
import ui from './ui';
import Builder, { Tree } from './builder';
import Watcher from './watcher';
import tryRequire from '../utils/try-require';
import startTimer from '../utils/timer';
import spinner from '../utils/spinner';
import DenaliObject from '../metal/object';
import Application from '../runtime/application';

const debug = createDebug('denali:project');

interface ProjectOptions {
  dir?: string;
  environment?: string;
  printSlowTrees?: boolean;
  lint?: boolean;
  audit?: boolean;
  buildDummy?: boolean;
}

interface WatchOptions {
  outputDir: string;
  onBuild: (project: Project) => void;
  beforeRebuild?:  () => Promise<void> | void;
}

interface Vulnerability {
  path: string[];
  module: string;
  version: string;
  recommendation: string;
}

export default class Project extends DenaliObject {

  builders = new Map();

  dir: string;
  environment: string;
  printSlowTrees: boolean;
  pkg: any;
  lint: boolean;
  audit: boolean;
  buildDummy: boolean;

  rootBuilder: Builder;

  constructor(options: ProjectOptions) {
    super();
    this.dir = options.dir || process.cwd();
    debug(`creating project for ${ this.dir }`);
    this.environment = options.environment || 'development';
    this.printSlowTrees = options.printSlowTrees || false;
    this.pkg = require(path.join(this.dir, 'package.json'));
    this.lint = options.lint;
    this.audit = options.audit;
    this.buildDummy = options.buildDummy;
    this.pkg = require(path.join(this.dir, 'package.json'));
  }

  get isAddon(): boolean {
    return this.pkg.keywords && this.pkg.keywords.includes('denali-addon');
  }

  getBuilderAndTree(): { builder: Builder, tree: Tree, broccoliBuilder: any } {
    let rootBuilder = this.rootBuilder = Builder.createFor(this.dir, this);
    let rootTree = rootBuilder.toTree();

    if (this.isAddon && this.buildDummy) {
      rootTree = this.buildDummyTree(rootTree);
    }

    let broccoliBuilder = new broccoli.Builder(rootTree);
    function onExit() {
      broccoliBuilder.cleanup();
      process.exit(1);
    }
    process.on('SIGINT', onExit);
    process.on('SIGTERM', onExit);

    debug(`building ${ this.pkg.name }`);
    return {
      builder: rootBuilder,
      tree: rootTree,
      broccoliBuilder
    };
  }

  buildDummyTree(rootTree: Tree): Tree {
    debug(`building ${ this.pkg.name }'s dummy app`);
    let dummyBuilder = Builder.createFor(path.join(this.dir, 'test', 'dummy'), this, [ this.dir ]);
    let dummyTree = dummyBuilder.toTree();
    let addonTests = new Funnel(rootTree, {
      include: [ 'test/**/*' ],
      exclude: [ 'test/dummy/**/*' ]
    });
    rootTree = new Funnel(rootTree, {
      exclude: [ 'test/**/*' ],
      destDir: path.join('node_modules', this.pkg.name)
    });
    return new MergeTree([ rootTree, dummyTree, addonTests ], { overwrite: true });
  }

  async build(outputDir: string = 'dist'): Promise<string> {
    debug('building project');
    let { broccoliBuilder } = this.getBuilderAndTree();
    spinner.start(`Building ${ this.pkg.name }`);
    let timer = startTimer();
    try {
      let results = await broccoliBuilder.build();
      this.finishBuild(results, outputDir);
      spinner.succeed(`${ this.pkg.name } build complete (${ timer.stop() }s)`);
    } catch (err) {
      ui.error('');
      if (err.file) {
        ui.error(`File: ${ err.file }`);
      }
      ui.error(err.stack);
      spinner.fail('Build failed');
      throw err;
    } finally {
      await broccoliBuilder.cleanup();
    }
    return outputDir;
  }

  watch(options: WatchOptions): void {
    options.outputDir = options.outputDir || 'dist';
    options.onBuild = options.onBuild || noop;
    // Start watcher
    let timer = startTimer();
    let { broccoliBuilder, builder } = this.getBuilderAndTree();
    spinner.start(`Building ${ this.pkg.name }`);
    let watcher = new Watcher(broccoliBuilder, { beforeRebuild: options.beforeRebuild, interval: 100 });

    // Watch/build any child addons under development
    let inDevelopmentAddons = builder.childBuilders.filter((childBuilder) => {
      return childBuilder.isDevelopingAddon && fs.lstatSync(childBuilder.dir).isSymbolicLink();
    });
    // Don't finalize the first build until all the in-dev addons have built too
    options.onBuild = after(inDevelopmentAddons.length, options.onBuild);
    // Build the in-dev child addons
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
      addonProject.watch({ onBuild: options.onBuild, outputDir: addonDist });
    });

    // Handle watcher events
    watcher.on('buildstart', () => {
      debug('changes detected, rebuilding');
      spinner.start(`Building ${ this.pkg.name }`);
      timer = startTimer();
    });
    watcher.on('change', (results: { directory: string, graph: any }) => {
      debug('rebuild finished, wrapping up');
      this.finishBuild(results, options.outputDir);
      spinner.succeed(`${ this.pkg.name } build complete (${ timer.stop() }s)`);
      options.onBuild(this);
    });
    watcher.on('error', (error: any) => {
      spinner.fail('Build failed');
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

  async createApplication(): Promise<Application> {
    try {
      let outputDir = await this.build();
      let applicationPath = path.resolve(path.join(outputDir, 'app', 'application'));
      let Application = tryRequire(applicationPath);
      if (!Application) {
        throw new Error(`Denali was unable to load app/application.js from ${ applicationPath }`);
      }
      return new Application({
        dir: path.resolve(outputDir),
        environment: this.environment
      });
    } catch (error) {
      ui.error(error.stack);
      throw error;
    }
  }

  finishBuild(results: { directory: string, graph: any }, outputDir: string) {
    // Copy the result out of broccoli tmp
    if (!path.isAbsolute(outputDir)) {
      outputDir = path.join(process.cwd(), outputDir);
    }
    rimraf.sync(outputDir);
    copyDereferenceSync(results.directory, outputDir);

    // Print slow build trees
    if (this.printSlowTrees) {
      printSlowNodes(results.graph);
    }

    // Run an nsp audit on the package
    if (this.audit) {
      this.auditPackage();
    }
  }

  auditPackage() {
    let pkg = path.join(this.dir, 'package.json');
    nsp.check({ package: pkg }, (err: any, vulnerabilities: Vulnerability[]) => {
      if (err && [ 'ENOTFOUND', 'ECONNRESET' ].indexOf(err.code) > -1) {
        ui.warn('Error trying to scan package dependencies for vulnerabilities with nsp, unable to reach server. Skipping scan ...');
        ui.warn(err);
      }
      if (vulnerabilities && vulnerabilities.length > 0) {
        vulnerabilities = this.filterIgnoredVulnerabilities(vulnerabilities, this.rootBuilder.ignoreVulnerabilities);
        if (vulnerabilities.length > 0) {
          ui.warn('WARNING: Some packages in your package.json may have security vulnerabilities:');
          vulnerabilities.map(this.printVulnerability);
        }
      }
    });
  }

  filterIgnoredVulnerabilities(vulnerabilities: Vulnerability[], ignorePatterns: string[]): Vulnerability[] {
    return vulnerabilities.filter((vulnerability) => {
      return !ignorePatterns.find((ignorePattern) => {
        let ignorePatternPath = ignorePattern.split(' > ');
        let ignorePatternStart = ignorePatternPath[0].split('@');
        let potentialMatch = dropWhile(vulnerability.path, (dependency: string) => {
          let [ name, version ] = dependency.split('@');
          return !(name === ignorePatternStart[0] && semver.satisfies(version, ignorePatternStart[1]));
        });
        let matchingSequence = takeWhile(potentialMatch, (dependency, i) => {
          let [ name, version ] = dependency.split('@');
          if (!ignorePatternPath[i]) {
            return false;
          }
          let ignorePatternPart = ignorePatternPath[i].split('@');
          return name === ignorePatternPart[0] && semver.satisfies(version, ignorePatternPart[1]);
        });
        return potentialMatch.length > 0 && matchingSequence.length === ignorePatternPath.length;
      });
    });
  }

  printVulnerability(vulnerability: Vulnerability) {
    let dependencyPath = vulnerability.path.join(' => ');
    let module = `*** ${ vulnerability.module }@${ vulnerability.version } ***`;
    let recommendation = (vulnerability.recommendation || '').replace(/\n/g, ' ');
    let message = dedent`${ chalk.bold.yellow(module) }
                          Found in: ${ dependencyPath }
                          Recommendation: ${ chalk.reset.cyan(recommendation) }`;
    ui.warn(message);
  }

}
