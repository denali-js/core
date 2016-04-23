const fs = require('fs');
const path = require('path');
const walk = require('walk-sync');

module.exports = function requireDir(dirpath, options = {}) {
  let modules = {};
  let paths;
  if (options.recurse === false) {
    paths = fs.readdirSync(dirpath);
  } else {
    paths = walk(dirpath);
  }
  paths.forEach((filepath) => {
    let absolutepath = path.join(dirpath, filepath);
    if (fs.statSync(absolutepath).isFile() && /\.js$/.test(filepath)) {
      let moduleName = filepath.slice(0, filepath.length - 3);
      modules[moduleName] = require(absolutepath);
    }
  });
  return modules;
};
