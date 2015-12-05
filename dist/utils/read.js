import fs from 'fs';

export default function read(filepath) {
  return fs.readFileSync(filepath, 'utf-8');
};