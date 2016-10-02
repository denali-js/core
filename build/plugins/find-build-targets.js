const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const Plugin = require('broccoli-plugin');
const semver = require('semver');

module.exports = class FindBuildTargets extends Plugin {
  constructor(versionConfig) {
    super([ process.cwd() ], { annotation: 'find build targets' });
    versionConfig.branches = versionConfig.branches || [ 'master' ];
    this.versionConfig = versionConfig;
  }
  build() {
    let branches = execSync('git branch --list').toString().split('\n').map((row) => {
      return row.slice(2);
    });
    let tags = execSync('git tag --list').toString().split('\n');
    let refs = branches.concat(tags).filter((ref) => {
      let isSemverTag = Boolean(semver.valid(ref));
      let isNotSkipped = !(this.versionConfig.skip || []).includes(ref);
      let isTargetBranch = this.versionConfig.branches.includes(ref);
      return isNotSkipped && (isSemverTag || isTargetBranch);
    });
    refs.forEach((ref) => {
      let outputPath = path.join(this.outputPath, ref);
      fs.writeFileSync(outputPath, ref);
    });
  }
};
