const fs = require('fs');
const compile = require('../lib/compile');
const forIn = require('lodash/forIn');
const path = require('path');
const assert = require('assert');
const Plugin = require('broccoli-plugin');
const buildVersionMeta = require('../lib/build-version-meta');


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
      console.log('compile api docs', version.ref);
      let outputDir = path.join(this.outputPath, version.name, 'api');

      // Classes
      forIn(version.data.classes, (klass) => {
        let template = path.join(templatesDir, 'api', 'class.ejs');
        let outputFile = path.join(outputDir, 'classes', klass.name, 'index.html');
        let templateData = {
          klass,
          version,
          versions,
          url: path.join('api', 'classes', klass.name)
        };
        compile(template, templateData, outputFile);
      });

      // Modules
      forIn(version.data.modules, (mod) => {
        let template = path.join(templatesDir, 'api', 'module.ejs');
        let outputFile = path.join(outputDir, 'modules', mod.name, 'index.html');
        let templateData = {
          mod,
          version,
          versions,
          url: path.join('api', 'modules', mod.name)
        };
        compile(template, templateData, outputFile);
      });
    });
  }
};
