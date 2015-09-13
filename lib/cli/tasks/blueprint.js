import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dive from 'diveSync';
import mkdirp from 'mkdirp';
import trash from 'trash';
import { isDir, read, write } from '../../utils';
import template from 'lodash-node/modern/string/template';

export function generate(options) {
  let templateFiles = path.join(options.src, 'files');
  let blueprint = blueprintFor(options.src);
  let data = blueprint.locals(options.args);

  dive(templateFiles, { all: true }, (err, absolutepath) => {
    console.log(absolutepath);
    if (isDir(absolutepath)) { return; }
    let relativepath = path.relative(templateFiles, absolutepath);

    let filenameTemplate = template(relativepath, { interpolate: /__([\S]+)__/g });
    let destRelativepath = filenameTemplate(data).replace('gitkeep', '.gitkeep');
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

export function destroy(options) {
  let templateFiles = path.join(options.src, 'files');
  let blueprint = blueprintFor(options.src);
  let data = blueprint.locals(options.args);

  let filesToDelete = [];
  dive(templateFiles, { all: true }, (err, absolutepath) => filesToDelete.push(absolutepath));

  // Get the absolute paths for the template source file and the dest file
  filesToDelete = filesToDelete.map((relativepath) => {
    let absolutepath = path.join(templateFiles, relativepath);
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

function blueprintFor(srcpath) {
  let blueprint = require(path.join(srcpath, 'index.js'));
  blueprint.locals = blueprint.locals || function() { return {}; };
  blueprint.postInstall = blueprint.postInstall || function() {};
  blueprint.postUninstall = blueprint.postInstall || function() {};
  return blueprint;
}

function runWithCwd(cwd, fn, ...args) {
  let originalCwd = process.cwd();
  process.chdir(cwd);
  fn(...args);
  process.chdir(originalCwd);
}
