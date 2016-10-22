import fs from 'fs';

export default function assertDirExists(t, dirpath, message) {
  t.true(fs.existsSync(dirpath), message);
  t.true(fs.statSync(dirpath).isDirectory(), message);
}
