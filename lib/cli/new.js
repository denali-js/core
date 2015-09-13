import path from 'path';
import { generate } from './tasks/blueprint';

let args = process.argv.slice(2);

generate({
  src: path.join(__dirname, './blueprints/app'),
  dest: path.join(process.cwd(), args[0]),
  args: args
});
