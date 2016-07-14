const path = require('path');
const fs = require('fs-extra');
const assert = require('assert');
const Plugin = require('broccoli-plugin');
const semver = require('semver');

module.exports = class FindBuildTargets extends Plugin {
  constructor(refs, versionConfig) {
    assert(!Array.isArray(refs), 'You must pass a single node to FindBuildTargets');
    super([ refs ], { annotation: 'find build targets' });
    versionConfig.branches = versionConfig.branches || [ 'master' ];
    this.versionConfig = versionConfig;
  }
  build() {
    assert(this.inputPaths.length === 1, 'You should only supply a single input node to FindBuildTargets');
    let refs = fs.readdirSync(this.inputPaths[0]);
    refs = refs.filter((ref) => {
      let isSemverTag = Boolean(semver.valid(ref));
      let isNotSkipped = !(this.versionConfig.skip || []).includes(ref);
      let isTargetBranch = this.versionConfig.branches.includes(ref);
      return isNotSkipped && (isSemverTag || isTargetBranch);
    });
    refs.forEach((ref) => {
      let inputPath = path.join(this.inputPaths[0], ref);
      let contents = fs.readFileSync(inputPath);
      let outputPath = path.join(this.outputPath, ref);
      fs.writeFileSync(outputPath, contents);
    });
  }
};
