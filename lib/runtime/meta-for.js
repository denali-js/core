const metaSymbol = Symbol('denali meta property');

let uuid = 0;

export default function metaFor(target) {
  if (!target.hasOwnProperty(metaSymbol)) {
    uuid += 1;
    target[metaSymbol] = {
      id: uuid
    };
  }
  return target[metaSymbol];
}
