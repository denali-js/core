import assert from 'assert';

export interface MixinApplicator {
  (...args: any[]): MixinApplicator;
  _args: any[];
  _factory: MixinFactory;
};

export interface MixinFactory {
 (base: Function, ...args: any[]): Function;
}

/**
 * ES6 classes don't provide any native syntax or support for compositional mixins. This helper
 * method provides that support:
 *
 *     import { mixin } from 'denali';
 *     import MyMixin from '../mixins/my-mixin';
 *     import ApplicationAction from './application';
 *
 *     export default class MyAction extends mixin(ApplicationAction, MyMixin) {
 *       // ...
 *     }
 *
 * Objects that extend from Denali's Object class automatically get a static `mixin` method to make
 * the syntax a bit more familiar:
 *
 *     export default class MyAction extends ApplicationAction.mixin(MyMixin) {
 *
 * ## How it works
 *
 * Since ES6 classes are based on prototype chains, and protoype chains are purely linear (you can't
 * have two prototypes), we implement mixins by creating anonymous intermediate subclasses for each
 * applied mixin.
 *
 * Mixins are defined as factory functions that take a base class and extend it with their own
 * mixin properties/methods. When these mixin factory functions are applied, they are called in
 * order, with the result of the last mixin feeding into the base class of the next mixin factory.
 *
 * @export
 * @param {Function} baseClass
 * @param {...MixinApplicator[]} mixins
 * @returns {Function}
 * @module denali
 * @submodule metal
 */
export default function mixin(baseClass: Function, ...mixins: MixinApplicator[]): Function {
  return mixins.reduce((currentBase: Function, mixinFactory: MixinApplicator) => {
    let appliedClass = mixinFactory._factory(currentBase, ...mixinFactory._args);
    assert(typeof appliedClass === 'function', `Invalid mixin (${ appliedClass }) - did you forget to return your mixin class from the createMixin method?`);
    return appliedClass;
  }, baseClass);
}

/**
 * Creates a mixin factory function wrapper. These wrapper functions have the special property that
 * they can be invoked an arbitrary number of times, and each time will cache the arguments to be
 * handed off to the actual factory function.
 *
 * This is useful to allow per-use options for your mixin. For example:
 *
 *     class ProtectedAction extends Action.mixin(authenticate({ ... })) {
 *
 * In that example, the optons object provided to the `authenticate` mixin function will be cached,
 * and once the mixin factory function is invoked, it will be provided as an additional argument:
 *
 *     createMixin((BaseClass, options) => {
 *
 * @export
 * @param {MixinFactory} mixinFactory
 * @returns {MixinApplicator}
 */
export function createMixin(mixinFactory: MixinFactory): MixinApplicator {
  let cacheMixinArguments = <MixinApplicator>function(...args: any[]): MixinApplicator {
    cacheMixinArguments._args.push(...args);
    return cacheMixinArguments;
  }
  cacheMixinArguments._args = [];
  cacheMixinArguments._factory = mixinFactory;
  return cacheMixinArguments;
}
