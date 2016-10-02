import assert from 'assert';

/**
 * ES6 classes don't provide any native syntax or support for compositional
 * mixins. This helper method provides that support:
 *
 *     import { mixin } from 'denali';
 *     import MyMixin from '../mixins/my-mixin';
 *     import ApplicationAction from './application';
 *
 *     export default class MyAction extends mixin(ApplicationAction, MyMixin) {
 *       // ...
 *     }
 *
 * ## How it works
 *
 * Since ES6 classes are based on prototype chains, and protoype chains are
 * purely linear (you can't have two prototypes), we implement mixins by
 * creating anonymous intermediate subclasses for each applied mixin.
 *
 * @class mixin
 * @module denali
 * @submodule metal
 */
export default function mixin(baseClass, ...mixins) {
  return mixins.reduce((currentBase, mixinFactory) => {
    let appliedClass = mixinFactory(currentBase);
    assert(typeof appliedClass === 'function', `Invalid mixin (${ appliedClass }) - did you forget to return your mixin class from the createMixin method?`);
    return appliedClass;
  }, baseClass);
}

/**
 * Since the mixins themselves cannot have their original prototype
 * modified (to preserve their ability to mix in to multiple different classes),
 * mixins must be defined as a function which returns a class, so that we can
 * effectively create a new mixin class definition for each use.
 *
 * @class createMixin
 */
export function createMixin(mixinFactory) {
  return function applyOptionsToMixinGenerator(...options) {
    return function invokeWithBase(base) {
      return mixinFactory(base, ...options);
    };
  };
}
