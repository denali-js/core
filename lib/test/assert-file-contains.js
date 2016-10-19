import fs from 'fs';

export default function assertFileContains(t, filepath, needle, message) {
  let haystack = fs.readFileSync(filepath, 'utf-8');
  t.regex(haystack, needle, message);
}
