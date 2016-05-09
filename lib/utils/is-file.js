import fs from 'fs';

export default function isFile(path) {
  return fs.existsSync(path) && fs.statSync(path).isFile();
}
