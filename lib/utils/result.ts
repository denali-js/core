export default function result<T>(valueOrFn: ((...args: any[]) => T) | T, ...args: any[]): T {
  if (typeof valueOrFn === 'function') {
    return valueOrFn(...args);
  } else {
    return valueOrFn;
  }
}