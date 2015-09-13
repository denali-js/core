import isArray from 'lodash-node/modern/lang/isArray';

export default function ensureArray(obj) {
  if (isArray(obj)) {
    return obj;
  } else if (obj != null) {
    return [ obj ];
  } else {
      return [];
  }
}
