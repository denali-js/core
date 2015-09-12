import fs from 'fs';

export default function isDir(path) {
  return fs.existsSync(path) && fs.statSync(path).isDirectory();
}
