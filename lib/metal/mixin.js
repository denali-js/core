/**
 * @module denali
 * @submodule metal
 */
const mixinGeneratorSymbol = Symbol('mixin-generator');

/**
 * ES6 classes don't provide any native syntax or support for compositional
 * mixins. This helper method provides that support. Since ES6 classes are based
 * on prototype chains, and protoype chains are purely linear (you can't have
 * two prototypes), we implement mixins by creating anonymous intermediate
 * subclasses for each applied mixin.
 *
 * @class mixin
 */
export default function mixin(base, ...mixins) {
  return mixins.reduce((currentBase, mixinGenerator) => {
    // TODO why is this not working properly?
    //if (!mixinGenerator[mixinGeneratorSymbol]) {
      //throw new Error('Mixins must be created using the `createMixin` method.');
    //}
    let mixinClass = mixinGenerator();
    mixinClass.prototype = Object.create(currentBase.prototype, {
      constructor: {
        value: mixinClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    Object.setPrototypeOf(mixinClass, currentBase);
    return mixinClass;
  }, base);
}

/**
 * Since the mixins themselves cannot have their original prototype
 * modified (to preserve their ability to mix in to multiple different classes),
 * mixins must be defined as a function which returns a class, so that we can
 * effectively create a new mixin class definition for each use.
 *
 * @class createMixin
 */
export function createMixin(mixinGenerator) {
  return function applyOptionsToMixinGenerator(options = {}) {
    let mixinGeneratorWithOptions = mixinGenerator.bind(null, options);
    mixinGeneratorWithOptions[mixinGeneratorSymbol] = true;
    return mixinGeneratorWithOptions;
  };
}
