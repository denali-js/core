export default function eachPrototype(obj, fn) {
  let prototype = obj;
  while (prototype !== Object) {
    fn(prototype);
    prototype = Object.getPrototypeOf(prototype);
  }
}
