import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

export default function symlinkAll(src, dest) {
  mkdirp.sync(dest);
  fs.readdirSync(src).forEach((file) => {
    fs.symlinkSync(path.join(src, file), path.join(dest, file));
  });
}
