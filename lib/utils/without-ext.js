import path from 'path';

export default function withoutExt(f) {
  return path.join(path.dirname(f), path.basename(f, path.extname(f)));
}
