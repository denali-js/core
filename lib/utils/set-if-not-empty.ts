import { isArray, isEmpty, set } from 'lodash';

export default function setIfNotEmpty<T extends object>(obj: T, key: keyof T, value: any): void {
  if (isArray(value) || !isEmpty(value)) {
    set<T>(obj, key, value);
  }
}
