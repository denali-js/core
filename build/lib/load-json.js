const fs = require('fs');

module.exports = function loadJSON(path) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
};
