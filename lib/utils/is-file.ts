import fs from 'fs';

export default function isFile(path: string): boolean {
  return fs.existsSync(path) && fs.statSync(path).isFile();
}
