import assert from 'assert';
import util from 'util';
import DenaliObject from './object';
import capitalize from 'lodash/string/capitalize';
import camelCase from 'lodash/string/camelCase';
import forEach from 'lodash/collection/forEach';

const meta = Symbol('denali:container:meta');
const factoryFlag = Symbol.for('denali:factory');

export default DenaliObject.extend({

  init() {
    this._registry = {};
    this._types = {};
    this._typeInstances = {};
    this._singletons = {};
    this._super(...arguments);
    this.register('application:main', this.application);
  },

  // Manually supply the direct reference you wish to register with the container
  register(fullName, value) {
    let name = this.parseName(fullName);
    this._registry[name.fullName] = value;
    if (!this._types[name.type]) {
      this._types[name.type] = {};
    }
    this._types[name.type][name.modulePath] = value;
    if (this._typeInstances[name.type]) {
      this._typeInstances[name.type][name.modulePath] = this.lookup(name.fullName);
    }
  },

  // Lookup a given value in the container - based off inspection of that value,
  // potentially instantiate
  lookup(fullName) {
    let name = this.parseName(fullName);
    if (name.wildcard) {
      return this._lookupAll(name.type);
    }
    let lookupMethod = this['lookup' + capitalize(name.type)];
    let result;
    if (lookupMethod) {
      result = lookupMethod.call(this, name);
    }
    result = this.lookupOther(name);
    if (result) {
      result[meta] = { name };
    }
    return result;
  },

  lookupInitializer(name) {
    let initializer = this.lookupOther(name);
    initializer.name = name.modulePath;
    return initializer;
  },

  lookupSerializer(name) {
    let serializer = this.lookupOther(name);
    if (!this._typeInstances.serializer) {
      this._typeInstances.serializer = {};
    }
    serializer.serializers = this._typeInstances.serializer;
    return serializer;
  },

  lookupOther(name) {
    let fullName = name.fullName;
    if (!this._registry[fullName]) {
      return null;
    }
    let value = this._registry[fullName];
    if (value[factoryFlag]) {
      this._runFactory(name);
      return this.lookup(name.fullName);
    }
    assert(!(value.singleton && value.instantiate), `You cannot set the 'singleton' as well as 'instantiate' container flag - they are mutually exclusive (${ fullName })`);
    if (value.singleton) {
      if (!this._singletons[fullName]) {
        assert(typeof value === 'function', `Only functions can have the 'singleton' flag; you provided ${ util.inspect(value) }.`);
        this._singletons[fullName] = new value({ container: this });
      }
      return this._singletons[fullName];
    }
    if (value.instantiate) {
      assert(typeof value === 'function', `Only functions can have the 'instantiate' flag; you provided ${ value }.`);
      return new value({ container: this });
    }
    return value;
  },

  // Factories are special-cased - the first time they are looked up, they run
  // their build function and replace themselves in the container with the
  // return value of that function.
  _runFactory(name) {
    let FactoryClass = this._registry[name.fullName];
    let factory = new FactoryClass({ container: this });
    // We have to eagerly attach the meta here, since the Factory never gets
    // returned by the lookup method (which normally does the meta attachment)
    factory[meta] = { name };
    let result = factory.build();
    result.singleton = factory.singleton;
    result.instantiate = factory.instantiate;
    this._registry[name.fullName] = result;
    this._types[name.type][name.moduleName] = result;
  },

  _lookupAll(type) {
    if (!this._typeInstances[type]) {
      let typeInstances = this._typeInstances[type] = {};
      forEach(this._types[type], (mod, moduleName) => {
        typeInstances[moduleName] = typeInstances[moduleName] || this.lookup(type + ':' + moduleName);
      });
    }
    return this._typeInstances[type];
  },

  parseName(fullName) {
    let [ type, modulePath ] = fullName.split(':');
    return {
      fullName,
      type,
      modulePath,
      moduleName: camelCase(modulePath),
      wildcard: modulePath === '*'
    };
  },

  metaFor(value) {
    return value[meta];
  }

});
