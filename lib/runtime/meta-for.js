const metaSymbol = Symbol('denali meta property');

let uuid = 0;

export default function metaFor(target) {
  if (!target.hasOwnProperty(metaSymbol)) {
    uuid += 1;
    let meta = target[metaSymbol] = {
      id: uuid
    };
    if (target.constructor === Function) {
      meta.instanceCount = 0;
    }
  }
  return target[metaSymbol];
}
