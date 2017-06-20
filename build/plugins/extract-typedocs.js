const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const assert = require('assert');
const Plugin = require('broccoli-caching-writer');
const trim = require('lodash/trim');
const forIn = require('lodash/forIn');
const filter = require('lodash/filter');
const loadJSON = require('../lib/load-json');
const spinner = require('../lib/spinner');

module.exports = class ExtractTypedocs extends Plugin {
  constructor(versions) {
    assert(!Array.isArray(versions), 'You must pass a single node to ExtractTypedocs');
    super([ versions ], { annotation: 'extract typedocs' });
  }
  build() {
    let versions = fs.readdirSync(this.inputPaths[0]);
    versions.forEach((version) => {
      let versionDir = path.join(this.inputPaths[0], version);
      let outputPath = path.join(this.outputPath, version, 'data.json');
      spinner.start(`extracting inline docs for ${ version } - installing dependencies`);
      execSync(`yarn`, { cwd: versionDir });
      spinner.succeed();
      spinner.start(`extracting inline docs for ${ version } - running typedoc`);
      execSync(`typedoc --ignoreCompilerErrors --tsconfig ${ path.join(versionDir, 'tsconfig.json') } --json ${ outputPath } ${ versionDir }`, { cwd: versionDir, });
      spinner.succeed();
      let data = loadJSON(outputPath);
      this.normalizeData(data, versionDir);
      spinner.succeed(`Found ${ data.exportedItems.length } documented items across ${ Object.keys(data.packages).length } packages`);
      fs.writeFileSync(outputPath, JSON.stringify(data));
    });
  }
  normalizeData(data, root) {
    let packages = data.packages = {};
    let exportedItems = data.exportedItems = [];
    data.children.forEach((file) => {
      (file.children || []).forEach((item) => {
        if (item.flags.isExported) {
          let comment;
          if (item.kindString === 'Function') {
            comment = item.signatures[0].comment;
          } else {
            comment = item.comment;
          }
          if (comment) {
            let pkg = (comment.tags || []).find((i) => i.tag === 'package');
            if (pkg) {
              exportedItems.push({ item, file });

              // Sort into it's package
              pkg = pkg.text.trim();
              packages[pkg] = packages[pkg] || [];
              packages[pkg].push({ item, file });
              item.package = pkg;

              if (item.kindString === 'Class') {
                // Use a Blueprint's blueprintName as it's name
                if (item.extendedTypes && item.extendedTypes[0].name === 'Blueprint') {
                  let blueprintName = item.children.find((i) => i.name === 'blueprintName');
                  item.name = blueprintName ? trim(blueprintName.defaultValue, '`\'"') : item.name;
                }

                // Use a Command's commandName as it's name
                if (item.extendedTypes && item.extendedTypes[0].name === 'Command') {
                  let commandName = item.children.find((i) => i.name === 'commandName');
                  item.name = commandName ? trim(commandName.defaultValue, '`\'"') : item.name;
                }
              }
            } else {
              console.warn(`${ item.name } in ${ file.name } is exported, but is missing a package tag`);
            }
          } else {
            console.warn(`${ item.name } in ${ file.name } is exported, but is missing a docblock comment`);
          }
        }
      });
    });
  }
};
