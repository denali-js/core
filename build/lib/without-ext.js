const path = require('path');

module.exports = function withoutExt(filepath) {
  return path.join(path.dirname(filepath), path.basename(filepath, path.extname(filepath)));
};
