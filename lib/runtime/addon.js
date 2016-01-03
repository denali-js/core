import assert from 'assert';
import path from 'path';
import glob from 'glob';
import DenaliObject from './object';
import express from 'express';
import findup from 'findup';
import resolve from 'resolve';
import log from '../utils/log';
import topsort from '../utils/topsort';
import eachDir from '../utils/each-dir';
import requireDir from '../utils/require-dir';
import tryRequire from '../utils/try-require';
import withoutExt from '../utils/without-ext';
import forIn from 'lodash/object/forIn';
import contains from 'lodash/collection/contains';
import values from 'lodash/object/values';
import metaFor from './meta-for';


export default DenaliObject.extend({

  init(options) {
    assert(options.dir, 'You must supply a dir to an Addon instance');
    assert(options.environment, 'You must supply an environment to an Addon instance');

    this.appDir = path.join(options.dir, 'app');
    this.configDir = path.join(options.dir, 'config');
    this.pkg = tryRequire(path.join(options.dir, 'package.json'));
    this.name = (this.pkg && this.pkg.name) || 'anonymous-addon';
    this.router = express.Router();

    this._super(...arguments);

    this.discoverAddons();
    this.load();
  },

  discoverAddons() {
    let addons = [];
    forIn(this.pkg.dependencies, (version, pkgName) => {
      let pkgMainPath = resolve.sync(pkgName, { basedir: this.dir });
      let pkgPath = findup.sync(pkgMainPath, 'package.json');
      let pkgJSONPath = path.join(pkgPath, 'package.json');
      let pkg = require(pkgJSONPath);
      let isDenaliAddon = pkg.keywords && contains(pkg.keywords, 'denali-addon');

      if (isDenaliAddon) {
        let loadOptions = pkg.denali || {};

        let AddonClass = tryRequire(path.join(root, 'app', 'addon.js')) || module.exports;
        let addon = new AddonClass({
          dir: pkgPath,
          environment: this.environment,
          parent: this
        });
        addons.push({
          name: pkg.name,
          value: addon,
          before: loadOptions.before,
          after: loadOptions.after
        });
      }
    });
    this.addons = topsort(addons);
  },

  load() {
    this.loadConfig();
    this.loadInitializers();
    this.loadMiddleware();
    this.loadApp();
    this.loadRoutes();
  },

  loadConfig() {
    this._config = this.loadConfigFile('environment') || function() { return {}; };
  },

  loadInitializers() {
    let initializersDir = path.join(this.configDir, 'initializers');
    this._initializers = values(requireDir(initializersDir));
  },

  loadMiddleware() {
    this._middleware = this.loadConfigFile('middleware') || function() {};
  },

  loadRoutes() {
    this._routes = this.loadConfigFile('routes') || function() {};
  },

  loadApp() {
    this._container = {};
    eachDir(this.appDir, (dir) => {
      let typeDir = path.join(this.appDir, dir);
      let typeContainer = this._container[dir] = {};
      glob.sync('**/*.js', { cwd: typeDir }).forEach((filepath) => {
        let modulepath = withoutExt(filepath);
        let appModule = typeContainer[modulepath] = require(path.join(typeDir, filepath));
        let meta = metaFor(appModule);
        meta.modulepath = modulepath;
        meta.addon = this;
      });
    });
  },

  loadConfigFile(filename) {
    return tryRequire(path.join(this.configDir, filename + '.js'));
  },

  log(level, ...msg) {
    if (this.environment !== 'test' || level === 'error') {
      msg.unshift(`[${ this.name }]`);
      log.call(this, level, ...msg);
    }
  },

  toString() {
    return `<${ this.name }:${ metaFor(this).id }>`;
  }

});
