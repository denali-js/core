import babelTree from 'broccoli-babel-transpiler';
import CoreObject from 'core-object';
import broccoli from 'broccoli';
import mergeTrees from 'broccoli-merge-trees';
import uglify from 'broccoli-uglify-sourcemap';
import eslint from 'broccoli-lint-eslint';
import { mv } from 'broccoli-stew';
import writeFile from 'broccoli-file-creator';
import chalk from 'chalk';
import printSlowNodes from 'broccoli-slow-trees';
import log from '../../utils/log';

export default CoreObject.extend({

  firstBuild: true,

  build() {
    let tree = this.toTree();
    let builder = new broccoli.Builder(tree, { tmpdir: './tmp' });
    if (this.watch) {
      let watcher = new broccoli.Watcher(builder);
      watcher.on('change', () => {
        try {
          let duration = Math.round(builder.outputNodeWrapper.buildState.totalTime) + 'ms';
          if (duration > 1000) {
            duration = chalk.yellow(duration);
          }
          log('info', `${ this.firstBuild ? 'Build' : 'Rebuild' } complete (${ duration })`);
          this.afterBuild(builder.outputPath);
          this.firstBuild = false;
          if (duration > 1000) {
            printSlowNodes(builder.outputNodeWrapper);
          }
        } catch (err) {
          console.log(err);
        }
      });
      watcher.watch();
    } else {
      return builder.build().then(() => {
        this.afterBuild(builder.outputPath);
      });
    }
  },

  toTree() {
    return mergeTrees([
      this.treeForPackage(),
      mv(this.treeForApp(), 'app'),
      mv(this.treeForConfig(), 'config')
    ], { overwrite: true });
  },

  lintTree(tree) {
    return eslint(tree, {
      throwOnError: false
    });
  },

  treeForPackage() {
    // Avoid selecting the root project folder as a tree, so manually write the
    // contents of package.json
    // https://github.com/broccolijs/broccoli/issues/173
    return mergeTrees([
      writeFile('package.json', JSON.stringify(this.pkg, null, 2))
    ]);
  },

  treeForApp() {
    let appTree = 'app';
    appTree = this.processJS(appTree);
    return appTree;
  },

  treeForConfig() {
    let configTree = 'config';
    configTree = this.processJS(configTree);
    return configTree;
  },

  processJS(tree) {
    // tree = this.lintTree(tree);
    tree = babelTree(tree, { browserPolyfill: true });
    let shouldMinify = ('minify' in this && this.minify) || this.environment === 'production';
    if (shouldMinify) {
      tree = uglify(tree);
    }
    return tree;
  }

});
