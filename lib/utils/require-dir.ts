import * as fs from 'fs-extra';
import * as path from 'path';
import * as walk from 'walk-sync';

/**
 * Recursively require every .js file in a directory. Returns an object whose keys are the filepaths
 * of the loaded modules (relative to the given directory). Handles modules with default exports
 * (the default export will be the returned module value).
 */
export default function requireDir(dirpath: string, options: { recurse?: false } = {}): { [moduleName: string]: any } {
  let modules: { [moduleName: string]: any } = {};
  let paths;
  if (options.recurse === false) {
    paths = fs.readdirSync(dirpath);
  } else {
    paths = <string[]>walk(dirpath);
  }
  paths.forEach((filepath) => {
    let absolutepath = path.join(dirpath, filepath);
    if (fs.statSync(absolutepath).isFile() && /\.js$/.test(filepath)) {
      let moduleName = filepath.slice(0, filepath.length - 3);
      let mod = require(absolutepath);
      modules[moduleName] = mod.default || mod;
    }
  });
  return modules;
}
