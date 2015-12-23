import babelTree from 'broccoli-babel-transpiler';
import CoreObject from 'core-object';
import broccoli from 'broccoli';
import mergeTrees from 'broccoli-merge-trees';
import uglify from 'broccoli-uglify-writer';

export default CoreObject.extend({

  build(outputDir) {
    let tree = this.toTree();
    let builder = new broccoli.Builder(tree);
    if (this.watch) {
      let watcher = new broccoli.Watcher(builder);
      watcher.watch().finally(() => {
        builder.cleanup();
      });
      watcher.on('change', () => {
        console.log('Built - ' + Math.round(builder.outputNodeWrapper.buildState.totalTime) + ' ms @ ' + new Date().toString());
        this.afterBuild();
      });
    } else {
      return builder.build(outputDir);
    }
  },

  toTree() {
    return mergeTrees([
      this.treeForApp(),
      this.treeForConfig()
    ]);
  },

  treeForApp() {
    let appTree = 'app';
    appTree = babelTree('app', { browserPolyfill: true });
    appTree = uglify(appTree);
    return appTree;
  },

  treeForConfig() {
    let configTree = 'config';
    configTree = babelTree('config', { browserPolyfill: true });
    configTree = uglify(configTree);
    return configTree;
  }

});
