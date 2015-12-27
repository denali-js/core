import CoreObject from 'core-object';
import walk from 'walk-sync';
import path from 'path';
import fs from 'fs';

const JS_EXT = /\.js$/;

export default CoreObject.extend({

  init() {
    this._super(...arguments);
    this._registry = new Map();
  },

  register(name, value) {
    this._registry.set(name, value);
  },

  registerDir(dirpath, typeName) {
    let paths = walk(dirpath);
    paths.forEach((filepath) => {
      let absolutepath = path.join(dirpath, filepath);
      let moduleName = filepath.replace(JS_EXT, '');
      if (fs.statSync(absolutepath).isFile() && JS_EXT.test(absolutepath)) {
        this.register(typeName + '/' + moduleName, require(absolutepath));
      }
    });
  },

  lookup(modulepath) {
    return this._registry.get(modulepath);
  },

  lookupType(type) {
    let modules = {};
    this._registry.forEach((value, key) => {
      if (key.split('/')[0] === type) {
        modules[key] = value;
      }
    });
    return modules;
  }

});
