const fs = require('fs');
const path = require('path');

module.exports = function eachDir(dirpath, fn) {
  fs.readdirSync(dirpath).forEach((childpath) => {
    let absolutepath = path.join(dirpath, childpath);
    if (fs.statSync(absolutepath).isDirectory()) {
      fn(childpath);
    }
  });
};
