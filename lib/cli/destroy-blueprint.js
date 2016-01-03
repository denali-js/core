import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dive from 'diveSync';
import trash from 'trash';
import read from '../read';
import isDir from '../../utils/is-dir';
import template from 'lodash/string/template';
import blueprintFor from './blueprint-for';
import runWithCwd from './run-with-cwd';

export default function destroy(options) {
  let templateFiles = path.join(options.src, 'files');
  let blueprint = blueprintFor(options.src);
  let data = blueprint.locals(options.args);

  let filesToDelete = [];
  dive(templateFiles, { all: true }, (err, absolutepath) => filesToDelete.push(absolutepath));

  // Get the absolute paths for the template source file and the dest file
  filesToDelete = filesToDelete.map((absolutepath) => {
    let relativepath = path.relative(templateFiles, absolutepath);
    let filenameTemplate = template(relativepath, { interpolate: /__([\S]+)__/g });
    let destRelativepath = filenameTemplate(data);
    let destAbsolutepath = path.join(options.dest, destRelativepath);
    return { destAbsolutepath, destRelativepath, absolutepath };

  // Ensure that the dest file actually exists
  }).filter(({ destAbsolutepath, destRelativepath, absolutepath }) => {
    if (isDir(absolutepath)) { return false; }
    let fileExists = fs.existsSync(destAbsolutepath);
    if (!fileExists) {
      console.log(`  ${ chalk.grey('missing') } ${ destRelativepath }`);
    }
    return fileExists;

  // And either hasn't been altered, or the force option is being used, to
  // ensure we don't destroy code
  }).filter(({ destAbsolutepath, absolutepath, destRelativepath }) => {
    let templateSrc = read(absolutepath);
    let compiled = template(templateSrc);
    let destFileIsNotDirty = read(destAbsolutepath) === compiled(data);

    if (destFileIsNotDirty) {
      console.log(`  ${ chalk.red('destroy') } ${ destRelativepath }`);
    } else {
      console.log(`  ${ chalk.blue('skipped') } ${ destRelativepath }`);
    }

    return destFileIsNotDirty;
  }).map(({ destAbsolutepath }) => {
    return destAbsolutepath;
  });

  trash(filesToDelete, () => {
    runWithCwd(options.dest, blueprint.postUninstall, data, options);
  });
}
