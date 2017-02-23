const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const assert = require('assert');
const Plugin = require('broccoli-caching-writer');
const spinner = require('../lib/spinner');

module.exports = class CheckoutVersions extends Plugin {
  constructor(refs) {
    assert(!Array.isArray(refs), 'You must pass a single node to CheckoutVersions');
    super([ refs ], { annotation: 'checkout versions' });
  }
  build() {
    let refs = fs.readdirSync(this.inputPaths[0]);
    refs.forEach((ref) => {
      spinner.start(`Checking out ${ ref } from git ...`);
      execSync(`git read-tree ${ ref }`);
      execSync(`git checkout-index --all --prefix ${ path.join(this.outputPath, ref) }${ path.sep }`);
      spinner.succeed();
    });
    execSync('git reset HEAD');
  }
}
