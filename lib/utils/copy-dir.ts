import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as mkdirp from 'mkdirp';

export default function copyDir(src: string, dest: string): void {
  glob.sync('**/*', { nodir: true, dot: true, cwd: src }).forEach((file) => {
    mkdirp.sync(path.dirname(path.join(dest, file)));
    fs.writeFileSync(path.join(dest, file), fs.readFileSync(path.join(src, file)));
  });
}
