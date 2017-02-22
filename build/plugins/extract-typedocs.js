const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const assert = require('assert');
const Plugin = require('broccoli-plugin');
const forIn = require('lodash/forIn');
const filter = require('lodash/filter');
const loadJSON = require('../lib/load-json');

module.exports = class ExtractTypedocs extends Plugin {
  constructor(versions) {
    assert(!Array.isArray(versions), 'You must pass a single node to ExtractTypedocs');
    super([ versions ], { annotation: 'extract typedocs' });
  }
  build() {
    let versions = fs.readdirSync(this.inputPaths[0]);
    versions.forEach((version) => {
      console.log('analyze', version);
      let versionDir = path.join(this.inputPaths[0], version);
      let outputPath = path.join(this.outputPath, version, 'data.json');
      execSync(`node_modules/.bin/typedoc --json ${ outputPath } ${ versionDir }`);
      let data = loadJSON(outputPath);
      this.normalizeData(data, versionDir);
      fs.writeFileSync(outputPath, JSON.stringify(data));
    });
  }
  normalizeData(data, root) {
    let packages = data.packages = {};
    let exportedItems = data.exportedItems = [];
    data.children.forEach((file) => {
      (file.children || []).forEach((item) => {
        if (item.isExported) {
          if (item.comment) {
            let pkg = (item.comment.tags || []).find((i) => i.tag === 'package');
            if (pkg) {
              packages[pkg.tag] = packages[pkg.tag] || [];
              packages[pkg.tag].push({ item, file });
              item.package = pkg.text;
              exportedItems.push({ item, file });
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
