const fs = require('fs');
const compile = require('../lib/compile');
const forIn = require('lodash/forIn');
const kebabCase = require('lodash/kebabCase');
const camelCase = require('lodash/camelCase');
const path = require('path');
const assert = require('assert');
const Plugin = require('broccoli-plugin');
const buildVersionMeta = require('../lib/build-version-meta');
const spinner = require('../lib/spinner');


module.exports = class CompileAPIDocs extends Plugin {
  constructor(versionsDir, { templatesDir, includes, versionConfig }) {
    assert(!Array.isArray(versionsDir), 'You must pass a single node of version data to CompileAPIDocs');
    super([ versionsDir, templatesDir, includes ], { annotation: 'compile api docs' });
    this.versionConfig = versionConfig;
  }
  build() {
    let [ versionsDir, templatesDir ] = this.inputPaths;
    let versionDirs = fs.readdirSync(versionsDir);
    let versionsMeta = buildVersionMeta(versionDirs, this.versionConfig);
    let versions = versionsMeta.map((version) => {
      let datapath = path.join(versionsDir, version.ref, 'data.json');
      version.data = require(datapath);
      return version;
    });
    versions.forEach((version) => {
      spinner.start(`compiling inline docs for ${ version.ref }`);
      let outputDir = path.join(this.outputPath, version.name, 'api');

      version.data.exportedItems.forEach(({ item, file }) => {
        let template = path.join(templatesDir, 'api', `${ kebabCase(item.kindString) }.ejs`);
        let outputFile = path.join(outputDir, item.package, kebabCase(item.name), 'index.html');
        let templateData = {
          [camelCase(item.kindString).replace('class', 'klass')]: item,
          version,
          versions,
          url: path.join('api', item.package, kebabCase(item.name))
        };
        compile(template, templateData, outputFile);
        spinner.succeed(`generated ${ item.package }/${ kebabCase(item.name) } - ${ version.ref }`);
      });
    });
  }
};