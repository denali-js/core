try {
  module.exports = require('denali/denali-build');
} catch (e) {
  if (e.message.includes('Cannot find module')) {
    module.exports = require('../../denali-build');
  } else {
    throw e;
  }
}
