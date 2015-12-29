import DenaliObject from './object';
import assert from 'assert';
import walk from 'walk-sync';
import path from 'path';
import fs from 'fs';
import assign from 'lodash/object/assign';
import forEach from 'lodash/collection/forEach';
import find from 'lodash/collection/find';

const JS_EXT = /\.js$/;

export default DenaliObject.extend({

  init() {
    this._super(...arguments);
    this._registry = new Map();
    this._typeMaps = new Map();
    this._singletons = new Map();
    this._children = [];
  },

  addChildContainer(child) {
    this._children.push(child);
    child._parent = this;
  },

  register(fullName, value) {
    let [ type, name ] = this.parseFullName(fullName);
    if (!this._typeMaps.has(type)) {
      this._typeMaps.set(type, {});
    }
    this._typeMaps.get(type)[name] = value;
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
    if (typeof fullName !== 'string') {
      fullName = this.compileFullName(fullName);
    }
    let result = this._registry.get(fullName);
    if (!result) {
      find(this._children, (child) => {
        let childResult = child.lookup(fullName);
        result = childResult || result;
        return childResult;
      });
    }
    if (result && result._instantiate) {
      if (result._singleton) {
        if (!this._singletons.get(fullName)) {
          this._singletons.set(fullName, new result({ container: this }));
        }
        return this._singletons.get(fullName);
      }
      return new result({ container: this });
    }
    return result;
  },

  lookupType(type) {
    let result = {};
    forEach(this._typeMaps.get(type), (value, name) => {
      let fullName = this.compileFullName({ type, name });
      result[name] = this.lookup(fullName);
    });
    this._children.forEach((child) => {
      assign(result, child.lookupType(type));
    });
    return result;
  },

  parseFullName(fullName) {
    let [ type, ...name ] = fullName.split('/');
    return [ type, name.join('/') ];
  },

  compileFullName({ type, name }) {
    return type + '/' + name;
  }

});
