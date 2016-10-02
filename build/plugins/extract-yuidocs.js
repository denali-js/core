const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const assert = require('assert');
const Plugin = require('broccoli-plugin');
const forIn = require('lodash/forIn');
const filter = require('lodash/filter');
const loadJSON = require('../lib/load-json');

module.exports = class ExtractYuidocs extends Plugin {
  constructor(versions) {
    assert(!Array.isArray(versions), 'You must pass a single node to ExtractYuidocs');
    super([ versions ], { annotation: 'extract yuidocs' });
  }
  build() {
    let versions = fs.readdirSync(this.inputPaths[0]);
    versions.forEach((version) => {
      console.log('analyze', version);
      let versionDir = path.join(this.inputPaths[0], version);
      let outputDir = path.join(this.outputPath, version);
      execSync(`node_modules/.bin/yuidoc -p -q -o ${ outputDir } ${ versionDir }`);
      let data = loadJSON(path.join(outputDir, 'data.json'));
      this.normalizeData(data, versionDir);
      fs.writeFileSync(path.join(outputDir, 'data.json'), JSON.stringify(data));
    });
  }
  normalizeData(data, root) {
    forIn(data.warnings, (warningData) => {
      let [,file] = warningData.line.split('.tmp');
      console.log(`${warningData.message}\n(${file.slice(3)})\n\n`);
    });
    forIn(data.modules, (moduleData) => {
      moduleData.file = path.relative(root, moduleData.file);
    });
    forIn(data.classes, (classData) => {
      classData.file = path.relative(root, classData.file);
      classData.classitems = filter(data.classitems, { class: classData.name });
    });
    forIn(data.classitems, (classitemData) => {
      classitemData.file = path.relative(root, classitemData.file);
    });
  }
};
