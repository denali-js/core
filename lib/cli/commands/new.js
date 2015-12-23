import path from 'path';
import { generate } from './tasks/blueprint';

let args = process.argv.slice(2);

// TODO - support arbitrary blueprint sources (i.e. local blueprint folder, git repo, etc)

generate({
  src: path.join(__dirname, './blueprints/app'),
  dest: path.join(process.cwd(), args[0]),
  args
});
