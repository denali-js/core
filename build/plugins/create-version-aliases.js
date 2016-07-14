const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const assert = require('assert');
const Plugin = require('broccoli-plugin');
const semver = require('semver');
const forIn = require('lodash/forIn');
const sortVersions = require('../lib/sort-versions');


module.exports = class CreateVersionAliases extends Plugin {
  constructor(compiledVersions, versionConfig) {
    assert(!Array.isArray(compiledVersions), 'You must pass a single node to AddVersionAliases');
    super([ compiledVersions ], { annotation: 'add version aliases' });
    this.versionConfig = versionConfig;
  }
  build() {
    let versionsDir = this.inputPaths[0];
    let versions = sortVersions(fs.readdirSync(versionsDir));
    forIn(this.versionConfig.alias, (source, alias) => {
      // Allow for build time computed alias sources (i.e. latest -> most recent semver)
      source = typeof source === 'function' ? source(versions) : source;
      // aliasSource can be null, so skip if that's the case (i.e. a latest alias on a repo with no semver tags)
      if (source) {
        let src = path.join(versionsDir, source);
        let dest = path.join(this.outputPath, alias);
        fs.copySync(src, dest);
      }
    });
  }
};
