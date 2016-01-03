import fs from 'fs';

export default function write(filepath, contents) {
  return fs.writeFileSync(filepath, contents);
};
