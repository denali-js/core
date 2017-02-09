import fs from 'fs';
import path from 'path';
import glob from 'glob';
import mkdirp from 'mkdirp';

export default function copyDir(src: string, dest: string): void {
  glob.sync('**/*', { nodir: true, dot: true, cwd: src }).forEach((file) => {
    mkdirp.sync(path.dirname(path.join(dest, file)));
    fs.writeFileSync(path.join(dest, file), fs.readFileSync(path.join(src, file)));
  });
}
