const fs = require('fs');

module.exports = function isDir(path) {
  return fs.existsSync(path) && fs.statSync(path).isDirectory();
};
