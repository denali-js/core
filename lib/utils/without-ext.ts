import * as path from 'path';

export default function withoutExt(f: string): string {
  return path.join(path.dirname(f), path.basename(f, path.extname(f)));
}
