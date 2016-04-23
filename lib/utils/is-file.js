const fs = require('fs');

module.exports = function isFile(path) {
  return fs.existsSync(path) && fs.statSync(path).isFile();
};
