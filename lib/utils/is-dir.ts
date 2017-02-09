import fs from 'fs';

export default function isDir(path: string): boolean {
  return fs.existsSync(path) && fs.statSync(path).isDirectory();
}
