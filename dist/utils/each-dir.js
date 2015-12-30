import fs from 'fs';
import path from 'path';

export default function eachDir(dirpath, fn) {
  fs.readdirSync(dirpath).forEach((childpath) => {
    let absolutepath = path.join(dirpath, childpath);
    if (fs.statSync(absolutepath).isDirectory()) {
      fn(childpath);
    }
  });
}
