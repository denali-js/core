const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const assert = require('assert');
const Plugin = require('broccoli-plugin');

module.exports = class CheckoutVersions extends Plugin {
  constructor(refs) {
    assert(!Array.isArray(refs), 'You must pass a single node to CheckoutVersions');
    super([ refs ], { annotation: 'checkout versions' });
  }
  build() {
    let refs = fs.readdirSync(this.inputPaths[0]);
    console.log('versions to build', refs);
    refs.forEach((ref) => {
      execSync(`git read-tree ${ ref }`);
      execSync(`git checkout-index --all --prefix ${ path.join(this.outputPath, ref) }${ path.sep }`);
    });
    console.log(execSync('git status').toString())
    execSync('git reset head');
  }
}
