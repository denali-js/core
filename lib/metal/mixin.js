const mixinGeneratorSymbol = Symbol('mixin-generator');

export default function mixin(base, ...mixins) {
  return mixins.reduce((currentBase, mixinGenerator) => {
    if (!mixinGenerator[mixinGeneratorSymbol]) {
      throw new Error('Mixins must be created using the `createMixin` method.');
    }
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
  mixinGenerator[mixinGeneratorSymbol] = true;
  return function applyOptionsToMixinGenerator(options = {}) {
    return mixinGenerator.bind(null, options);
  };
}
