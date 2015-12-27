import fs from 'fs';
import path from 'path';
import walk from 'walk-sync';

export default function requireDir(dirpath) {
  let modules = {};
  walk(dirpath).forEach((filepath) => {
    let absolutepath = path.join(dirpath, filepath);
    if (fs.statSync(absolutepath).isFile() && /\.js$/.test(filepath)) {
      let moduleName = filepath.slice(0, filepath.length - 3);
      modules[moduleName] = require(absolutepath);
    }
  });
  return modules;
}
