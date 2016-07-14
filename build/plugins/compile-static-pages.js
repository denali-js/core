const path = require('path');
const FilterPlugin = require('broccoli-filter');
const compile = require('../lib/compile');

module.exports = class CompileStaticPages extends FilterPlugin {
  processString(contents, relativePath) {
    let templatePath = path.join(this.inputPaths[0], relativePath);
    return compile(templatePath, {
      version: {
        name: 'latest',
        ref: 'latest'
      }
    });
  }
  getDestFilePath(relativePath) {
    if (relativePath.startsWith('includes')) {
      return null;
    }
    return super.getDestFilePath(relativePath);
  }
};
