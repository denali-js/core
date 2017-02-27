const fs = require('fs');
const compile = require('../lib/compile');
const forIn = require('lodash/forIn');
const kebabCase = require('lodash/kebabCase');
const camelCase = require('lodash/camelCase');
const path = require('path');
const assert = require('assert');
const Plugin = require('broccoli-caching-writer');
const buildVersionMeta = require('../lib/build-version-meta');
const spinner = require('../lib/spinner');

let itemLocalNameMap = {
  'Class': 'klass',
  'Function': 'func',
  'Type alias': 'typeAlias',
  'Interface': 'interface'
};

module.exports = class CompileAPIDocs extends Plugin {
  constructor([ versionsDir, templatesDir, layoutsDir, includesDir ], versionConfig) {
    assert(!Array.isArray(versionsDir), 'You must pass a single node of version data to CompileAPIDocs');
    super([ versionsDir, templatesDir, layoutsDir, includesDir ], { annotation: 'compile api docs' });
    this.versionConfig = versionConfig;
  }
  build() {
    let [ versionsDir, templatesDir, layoutsDir, includesDir ] = this.inputPaths;
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

      // Compile the index page
      let indexTemplate = path.join(templatesDir, 'api', 'index.ejs');
      let indexOutput = path.join(outputDir, 'index.html');
      let indexData = { version, versions };
      compile(indexTemplate, layoutsDir, includesDir, indexData, indexOutput);

      // Compile each exported item's page
      version.data.exportedItems.forEach(({ item, file }) => {
        let template = path.join(templatesDir, 'api', `${ kebabCase(item.kindString) }.ejs`);
        let outputFile = path.join(outputDir, item.package, kebabCase(item.name), 'index.html');
        let localItemName = itemLocalNameMap[item.kindString];
        let templateData = {
          [localItemName]: item,
          item,
          file,
          version,
          versions,
          url: path.join('api', item.package, kebabCase(item.name))
        };
        compile(template, layoutsDir, includesDir, templateData, outputFile);
        spinner.succeed(`generated [${ version.ref }] ${ item.package }/${ kebabCase(item.name) }`);
      });
    });
  }
};