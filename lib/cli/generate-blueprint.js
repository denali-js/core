import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dive from 'diveSync';
import mkdirp from 'mkdirp';
import isDir from '../../utils/is-dir';
import read from '../read';
import write from '../write';
import template from 'lodash/string/template';
import blueprintFor from './blueprint-for';
import runWithCwd from './run-with-cwd';

export default function generate(options) {
  let templateFiles = path.join(options.src, 'files');
  let blueprint = blueprintFor(options.src);
  let data = blueprint.locals(options.args);

  dive(templateFiles, { all: true }, (err, absolutepath) => {
    if (err) {
      return console.log('Error generating blueprint:', err.stack || err);
    }
    if (isDir(absolutepath)) { return null; }
    let relativepath = path.relative(templateFiles, absolutepath);

    let filenameTemplate = template(relativepath, { interpolate: /__([\S]+)__/g });
    let destRelativepath = filenameTemplate(data);
    let destAbsolutepath = path.join(options.dest, destRelativepath);

    if (fs.existsSync(destAbsolutepath)) {
      return console.log(`  ${ chalk.green('already exists') } ${ destRelativepath}`);
    }

    let contents = read(absolutepath);
    let contentsTemplate = template(contents);
    mkdirp.sync(path.dirname(destAbsolutepath));
    write(destAbsolutepath, contentsTemplate(data));
    console.log(`  ${ chalk.green('create') } ${ destRelativepath}`);
  });

  runWithCwd(options.dest, blueprint.postInstall, data, options);
}
