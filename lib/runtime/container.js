import DenaliObject from './object';
import metaFor from './meta-for';
import walk from 'walk-sync';
import path from 'path';
import fs from 'fs';
import assign from 'lodash/object/assign';
import forEach from 'lodash/collection/forEach';
import find from 'lodash/collection/find';
import capitalize from 'lodash/string/capitalize';

const JS_EXT = /\.js$/;

export default DenaliObject.extend({

  init() {
    this._super(...arguments);
    this._registry = {};
    this._typeMaps = {};
    this._singletons = {};
    this._children = [];
  },

  addChildContainer(child) {
    this._children.push(child);
    child._parent = this;
  },

  register(fullName, value) {
    metaFor(value).containerPath = fullName;
    let { type, name } = this.normalizeName(fullName);
    if (!this._typeMaps[type]) {
      this._typeMaps[type] = {};
    }
    let rootContainer = this.getRootContainer();
    if (!rootContainer._typeMaps[type]) {
      rootContainer._typeMaps[type] = {};
    }
    this._typeMaps[type][name] = value;
    rootContainer._typeMaps[type][name] = value;
    this._registry[fullName] = value;
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

  lookup(name) {
    let parsedName = this.normalizeName(name);

    let lookupMethod = this['lookup' + capitalize(parsedName.type)] || this.lookupOther;
    let result = lookupMethod.call(this, parsedName);

    if (!result) {
      result = find(this._children, (child) => {
        let childResult = child.lookup(parsedName);
        result = childResult || result;
        return childResult;
      });
    }

    return result;
  },

  lookupAdapters: lookupSingleton,
  lookupSerializers: lookupSingleton,

  lookupOther({ fullName }) {
    let result = this._registry[fullName];
    if (result && result._instantiate) {
      let rootContainer = this.getRootContainer();
      if (result._singleton) {
        if (!this._singletons[fullName]) {
          let singleton = rootContainer._singletons[fullName] = new result({
            container: rootContainer
          });
          metaFor(singleton).containerPath = fullName;
        }
        return this._singletons[fullName];
      }
      return new result({ container: rootContainer });
    }
    return result;
  },

  lookupType(type) {
    return this._typeMaps[type];
    // let result = {};
    // forEach(this._typeMaps[type], (value, name) => {
    //   let fullName = this.normalizeName({ type, name });
    //   result[name] = this.lookup(fullName);
    // });
    // this._children.forEach((child) => {
    //   assign(result, child.lookupType(type));
    // });
    // return result;
  },

  normalizeName(rawName) {
    let type;
    let name;
    let fullName;
    if (typeof rawName === 'string') {
      [ type, ...name ] = rawName.split('/');
      name = name.join('/');
      fullName = rawName;
    } else {
      type = rawName.type;
      name = rawName.name;
      fullName = type + '/' + name;
    }
    return { type, name, fullName };
  },

  getRootContainer() {
    if (this._parent) {
      return this._parent.getRootContainer();
    }
    return this;
  }

});


function lookupSingleton({ fullName }) {
  let result = this._registry[fullName];
  let rootContainer = this.getRootContainer();
  if (!this._singletons[fullName]) {
    let singleton = rootContainer._singletons[fullName] = new result({
      container: rootContainer
    });
    metaFor(singleton).containerPath = fullName;
  }
  return this._singletons[fullName];
}
