import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Invoke the supplied callback for each directory in the supplied directory.
 */
export default function eachDir(dirpath: string, fn: (childpath: string) => void): void {
  fs.readdirSync(dirpath).forEach((childpath) => {
    let absolutepath = path.join(dirpath, childpath);
    if (fs.statSync(absolutepath).isDirectory()) {
      fn(childpath);
    }
  });
}
