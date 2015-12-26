import CoreObject from 'core-object';
import walk from 'walk-sync';
import path from 'path';
import fs from 'fs';

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
    let modules = paths.filter((filepath) => {
      return fs.statSync(filepath).isFile() && /\.js$/.test(filepath);
    });
    modules.forEach((modulepath) => {
      this.register(typeName + '/' + modulepath, require(path.join(dirpath, modulepath)));
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
