import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Invoke the supplied callback for each file (not directories) in the supplied directory.
 *
 * @package util
 */
export default function eachFile(dirpath: string, fn: (childpath: string) => void): void {
  fs.readdirSync(dirpath).forEach((childpath) => {
    let absolutepath = path.join(dirpath, childpath);
    if (fs.statSync(absolutepath).isFile()) {
      fn(childpath);
    }
  });
}
