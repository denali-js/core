import path from 'path';
import blueprint from './tasks/blueprint';

let args = process.argv.slice(2);

blueprint({
  src: path.join(__dirname, '../../generators/app'),
  dest: path.join(process.cwd(), args[0]),
  args: args
});
