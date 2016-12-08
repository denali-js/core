try {
  module.exports = require('denali/denali-build');
} catch (e) {
  module.exports = require('../../denali-build');
}
