import {
  uniq
} from 'lodash';
import { Container as GlimmerContainer, FactoryDefinition } from '@glimmer/di';
import Resolver from './resolver';
import Registry from './registry';

export default class Container extends GlimmerContainer {

  lookupAll(type: string) {
    // Get around the private keyword from glimmer
    let resolver = <Resolver>(<any>this)._resolver;
    let registry = <Registry>(<any>this)._registry;

    let resolvedEntries = resolver.availableForType(type);
    let registeredEntries = registry.availableForType(type);

    let typeMap: { [entry: string]: FactoryDefinition<any> } = {};
    uniq(resolvedEntries.concat(registeredEntries)).map((specifier) => {
      typeMap[specifier] = this.lookup(specifier);
    });
    return typeMap;
  }

}