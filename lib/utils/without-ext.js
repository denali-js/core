const path = require('path');

module.exports = function withoutExt(f) {
  return path.join(path.dirname(f), path.basename(f, path.extname(f)));
};
