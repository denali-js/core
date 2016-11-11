// This separate file is necessary to ensure that this runs before the rest
// of the static imports in lib/index.js. If we included this in lib/index.js,
// the other imports would run first, and the polyfill wouldn't be ready in time.
// This lets us keep ES2015 module syntax and named exports in lib/index.js,
// but still guarantee the polyfill loads first.
try {
  require('babel-polyfill');
} catch (e) { /* ignore the error that is thrown if the polyfill was already loaded by bin/denali */ }
