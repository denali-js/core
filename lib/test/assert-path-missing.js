import fs from 'fs';

export default function assertFileExists(t, filepath, message) {
  t.false(fs.existsSync(filepath), message);
}
