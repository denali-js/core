import fs from 'fs';
import path from 'path';
import trash from 'trash';
import mkdirp from 'mkdirp';
import { transformFile } from 'babel-core';
import sane from 'sane';
import walk from 'walk-sync';
import Promise from 'bluebird';
import Command from '../lib/command';
import ui from '../lib/ui';

const transpile = Promise.promisify(transformFile);

export default class BuildCommand extends Command {

  static commandName = 'build';
  static description = 'Compile your app into optimized ES5 code';
  static longDescription = `
Takes your app's ES201X source code and produces compiled, sourcemapped, and
optimized output compatible with Node 6.
  `;

  params = [];

  flags = {
    watch: {
      description: 'Continuously watch the source files and rebuild on changes',
      defaultValue: false,
      type: Boolean
    }
  };

  runsInApp = true;

  run({ flags }) {
    let dirs = [ 'app', 'config' ];
    this.build(dirs);
    if (flags.watch) {
      let watcher = sane('.', { glob: dirs.map((dir) => `${ dir }/**/*.js`) });
      watcher.on('ready', () => {
        ui.info('Waiting for changes to rebuild ...');
      });
      watcher.on('change', this.build.bind(this));
      watcher.on('add', this.build.bind(this));
      watcher.on('delete', this.build.bind(this));
    }
  }

  build(dirs = [ 'app', 'config' ]) {
    let start = new Date();
    return trash([ 'dist' ]).then(() => {
      return Promise.all(dirs.map((srcDir) => {
        let destDir = path.join('dist', srcDir);
        return Promise.all(walk(srcDir).map((relativepath) => {
          let dest = path.join(destDir, relativepath);
          mkdirp.sync(path.dirname(dest));
          if (relativepath.endsWith('.js')) {
            let absolutepath = path.resolve(path.join(srcDir, relativepath));
            return transpile(absolutepath, {
              sourceMaps: 'inline',
              sourceFileName: path.basename(relativepath)
            }).then((transpiled) => {
              fs.writeFileSync(dest, transpiled.code);
            });
          } else if (!relativepath.endsWith('/')) {
            fs.writeFileSync(dest, fs.readFileSync(path.join(srcDir, relativepath)));
          }
          return null;
        }));
      }));
    }).then(() => {
      fs.linkSync('node_modules', 'dist/node_modules');
      ui.info(`Build completed in ${ ((new Date()) - start) / 1000 }s`);
    }).catch((e) => {
      ui.error('Error building your app:');
      ui.error(e.stack);
      return Promise.reject(e);
    });
  }

}

