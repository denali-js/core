const mixinGeneratorSymbol = Symbol('mixin-generator');

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

export function createMixin(mixinGenerator) {
  return function applyOptionsToMixinGenerator(options = {}) {
    let mixinGeneratorWithOptions = mixinGenerator.bind(null, options);
    mixinGeneratorWithOptions[mixinGeneratorSymbol] = true;
    return mixinGeneratorWithOptions;
  };
}
