"use strict";

var DenaliObject = CoreObject.extend();
DenaliObject.extend = function extendWithMixins() {
  for (var _len = arguments.length, mixins = Array(_len), _key = 0; _key < _len; _key++) {
    mixins[_key] = arguments[_key];
  }

  return mixins.reduce(function (ResultClass, mixin) {
    return ResultClass.extend(mixin);
  }, CoreObject.extend());
};