const compile = require('../lib/compile');
const loadJSON = require('../lib/load-json');
const withoutExt = require('../lib/without-ext');
const path = require('path');
const frontmatter = require('front-matter');
const fs = require('fs-extra');
const assert = require('assert');
const Plugin = require('broccoli-plugin');
const buildVersionMeta = require('../lib/build-version-meta');


module.exports = class CompileGuides extends Plugin {
  constructor(versions, { templatesDir, includes, versionConfig }) {
    assert(!Array.isArray(versions), 'You must pass a single node of versions to CompileGuides');
    super([ versions, templatesDir, includes ], { annotation: 'compile guides' });
    this.versionConfig = versionConfig;
  }
  build() {
    let versionDirs = fs.readdirSync(this.inputPaths[0]);
    let versions = buildVersionMeta(versionDirs, this.versionConfig);
    versions.forEach((version) => {
      console.log('compile guides', version.ref);
      let guidesDir = path.join(this.inputPaths[0], version.ref, 'guides');
      let manifest = loadJSON(path.join(guidesDir, 'manifest.json'));
      let outputDir = path.join(this.outputPath, version.name, 'guides');

      manifest.categories.forEach((category) => {
        category.guides = category.guides.map((guideName) => {
          let guidePath = path.join(guidesDir, category.dir, guideName + '.md');
          let rawGuide = fs.readFileSync(guidePath, 'utf-8');
          return {
            name: guideName,
            data: frontmatter(rawGuide).attributes,
            category: category
          };
        });
      });

      manifest.categories.forEach((category) => {
        category.guides.forEach((guide) => {
          let guidePath = path.join(guidesDir, category.dir, guide.name + '.md');
          let outputFile = path.join(outputDir, category.dir, withoutExt(guide.name), 'index.html');
          let guideData = Object.assign({}, guide.data, {
            layout: 'guide',
            guide,
            categories: manifest.categories,
            version,
            versions,
            url: path.join('guides', category.dir, withoutExt(guide.name))
          });
          compile(guidePath, guideData, outputFile);
        });
      });
    });
  }
};
