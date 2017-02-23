const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');
const Plugin = require('broccoli-caching-writer');
const semver = require('semver');

module.exports = class FindBuildTargets extends Plugin {
  constructor(versionConfig) {
    super([], { annotation: 'find build targets' });
    versionConfig.branches = versionConfig.branches || [ 'master' ];
    this.versionConfig = versionConfig;
  }
  build() {
    let branches = execSync('git branch --list').toString().split('\n').map((row) => {
      return row.slice(2);
    }).filter((branch) => this.versionConfig.branches.includes(branch));
    let tags = execSync('git tag --list').toString().split('\n').filter((tag) => {
      if (!Boolean(semver.valid(tag))) {
        return false;
      }
      let matchesASkipTagPattern = false;
      this.versionConfig.skipTags.forEach((skipPattern) => {
        if (semver.satisfies(tag, skipPattern)) {
          matchesASkipTagPattern = true;
        }
      });
    });
    let refs = branches.concat(tags);
    refs.forEach((ref) => {
      let outputPath = path.join(this.outputPath, ref);
      fs.writeFileSync(outputPath, ref);
    });
  }
};
