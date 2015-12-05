import isArray from 'lodash/lang/isArray';

/**
 * Takes the provided argument and ensures that the return value is an array.
 * If it is already an array, it is returned as-is. If is null or undefined,
 * an empty array is returned. Otherwise, it wraps the argument in an array
 * and returns that array.
 *
 * @method ensureArray
 *
 * @param  {any} value
 *
 * @return {Array}
 */
export default function ensureArray(value) {
  if (isArray(value)) {
    return value;
  } else if (value != null) {
    return [value];
  } else {
    return [];
  }
}