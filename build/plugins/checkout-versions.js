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
    console.log(refs);
    refs.forEach((ref) => {
      console.log('checkout', ref, 'to', this.outputPath);
      execSync(`git read-tree ${ ref }`);
      execSync(`git checkout-index --all --prefix ${ path.join(this.outputPath, ref) }${ path.sep }`);
    });
    execSync('git reset HEAD');
  }
}
