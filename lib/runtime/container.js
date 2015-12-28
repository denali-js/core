import CoreObject from 'core-object';
import walk from 'walk-sync';
import path from 'path';
import fs from 'fs';
import assign from 'lodash/object/assign';
import find from 'lodash/collection/find';

const JS_EXT = /\.js$/;

export default CoreObject.extend({

  init() {
    this._super(...arguments);
    this._registry = new Map();
    this._typeMaps = new Map();
    this._children = [];
  },

  addChildContainer(child) {
    this._children.push(child);
  },

  register(fullName, value) {
    let [ type, name ] = this.parseFullName(fullName);
    if (!this._typeMaps.has(type)) {
      this._typeMaps.set(type, new Map());
    }
    this._typeMaps.get(type).set(name, value);
    this._registry.set(fullName, value);
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

  lookup(fullName) {
    let result = this._registry.get(fullName);
    if (!result) {
      find(this._children, (child) => {
        let childResult = child.lookup(fullName);
        result = childResult || result;
        return childResult;
      });
    }
    return result;
  },

  lookupType(type) {
    let result = assign({}, this._typeMaps.get(type));
    this._children.forEach((child) => {
      assign(result, child.lookupType(type));
    });
    return result;
  },

  parseFullName(fullName) {
    let [ type, ...name ] = fullName.split('/');
    return [ type, name.join('/') ];
  }

});
