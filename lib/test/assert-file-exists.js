import fs from 'fs';

export default function assertFileExists(t, filepath, message) {
  t.true(fs.existsSync(filepath), message);
  t.true(fs.statSync(filepath).isFile(), message);
}
