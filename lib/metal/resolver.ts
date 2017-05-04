import {
  upperFirst,
  camelCase,
  omitBy
} from 'lodash';
import { Resolver as GlimmerResolver, FactoryDefinition } from '@glimmer/di';
import * as tryRequire from 'try-require';
import * as path from 'path';
import { pluralize } from 'inflection';
import * as fs from 'fs';
import requireDir from '../utils/require-dir';

interface RetrieveMethod {
  (type: string, entry: string): FactoryDefinition<any>;
}

interface AvailableForTypeMethod {
  (type: string): string[];
}

export default class Resolver implements GlimmerResolver {

  [key: string]: any;

  identify(specifier: string, referrer?: string) {
    return '';
  }

  retrieve(specifier: string): FactoryDefinition<any> {
    let [ type, entry ] = specifier.split(':');
    let retrieveMethod = <RetrieveMethod>this[`retrieve${ upperFirst(camelCase(type)) }`];
    if (!retrieveMethod) {
      retrieveMethod = this.retrieveOther;
    }
    let result = retrieveMethod.call(this, type, entry);
    return result && result.default || result;
  }

  /**
   * Unknown types are assumed to exist underneath the `app/` folder
   */
  protected retrieveOther(type: string, entry: string) {
    return tryRequire(path.join(this.root, 'app', pluralize(type), entry));
  }

  /**
   * App files are found in `app/*`
   */
  protected retrieveApp(type: string, entry: string) {
    return tryRequire(path.join(this.root, 'app', entry));
  }

  /**
   * Config files are found in `config/`
   */
  protected retrieveConfig(type: string, entry: string) {
    return tryRequire(path.join(this.root, 'config', entry));
  }

  /**
   * Initializer files are found in `config/initializers/`
   */
  protected retrieveInitializer(type: string, entry: string) {
    return tryRequire(path.join(this.root, 'config', 'initializers', entry));
  }

  /**
   * Retrieve all the members for a given type. First checks for all manual registrations matching
   * that type, then retrieves all members for that type (typically from the filesystem).
   */
  public availableForType(type: string) {
    let availableMethod = <AvailableForTypeMethod>this[`availableFor${ upperFirst(camelCase(type)) }`];
    if (!availableMethod) {
      availableMethod = this.availableForOther;
    }
    return (<string[]>availableMethod.call(this, type)).map((entry) => `${ type }:${ entry}`);;
  }

  /**
   * Unknown types are assumed to exist in the `app/` folder
   */
  protected availableForOther(type: string) {
    let typeDir = path.join(this.root, 'app', pluralize(type));
    if (fs.existsSync(typeDir)) {
      return Object.keys(requireDir(typeDir));
    }
    return [];
  }

  /**
   * App files are found in `app/*`
   */
  protected retrieveAllApp(type: string) {
    let appDir = path.join(this.root, 'app');
    if (fs.existsSync(appDir)) {
      return Object.keys(requireDir(appDir, { recurse: false }));
    }
    return [];
  }

  /**
   * Config files are found in the `config/` folder. Initializers are _not_ included in this group
   */
  protected retrieveAllConfig(type: string) {
    let configDir = path.join(this.root, 'config');
    if (fs.existsSync(configDir)) {
      let entries = Object.keys(requireDir(configDir));
      return entries.filter((entry) => {
        return !entry.startsWith('initializers');
      });
    }
    return [];
  }

  /**
   * Initializers files are found in the `config/initializers/` folder
   */
  protected retrieveAllInitializer(type: string) {
    let initializersDir = path.join(this.root, 'config', 'initializers');
    if (fs.existsSync(initializersDir)) {
      return Object.keys(requireDir(initializersDir));
    }
    return [];
  }

}