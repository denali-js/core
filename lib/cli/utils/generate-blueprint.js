import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dive from 'diveSync';
import mkdirp from 'mkdirp';
import { isDir, read, write } from '../../utils';
import template from 'lodash/string/template';
import blueprintFor from './blueprint-for';
import runWithCwd from './run-with-cwd';

export function generate(options) {
  let templateFiles = path.join(options.src, 'files');
  let blueprint = blueprintFor(options.src);
  let data = blueprint.locals(options.args);

  dive(templateFiles, { all: true }, (err, absolutepath) => {
    if (isDir(absolutepath)) { return; }
    let relativepath = path.relative(templateFiles, absolutepath);

    let filenameTemplate = template(relativepath, { interpolate: /__([\S]+)__/g });
    let destRelativepath = filenameTemplate(data);
    let destAbsolutepath = path.join(options.dest, destRelativepath);

    if (fs.existsSync(destAbsolutepath)) {
      console.log(`  ${ chalk.green('already exists') } ${ destRelativepath}`);
      return;
    }

    let contents = read(absolutepath);
    let contentsTemplate = template(contents);
    mkdirp.sync(path.dirname(destAbsolutepath));
    write(destAbsolutepath, contentsTemplate(data));
    console.log(`  ${ chalk.green('create') } ${ destRelativepath}`);
  });

  runWithCwd(options.dest, blueprint.postInstall, data, options);
}
