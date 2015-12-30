const DenaliObject = CoreObject.extend();
DenaliObject.extend = function extendWithMixins(...mixins) {
  return mixins.reduce((ResultClass, mixin) => {
    return ResultClass.extend(mixin);
  }, CoreObject.extend());
};
