import fs from 'fs';
import path from 'path';

export default function eachFile(dirpath, fn) {
  fs.readdirSync(dirpath).forEach((childpath) => {
    let absolutepath = path.join(dirpath, childpath);
    if (fs.statSync(absolutepath).isFile()) {
      fn(childpath);
    }
  });
}
