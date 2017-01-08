import path from 'path';
import fs from 'fs';
import Plugin from 'broccoli-plugin';
import cloneDeep from 'lodash/cloneDeep';
import glob from 'glob';
import mkdirp from 'mkdirp';

export default class PackageTree extends Plugin {

  constructor(builder, options) {
    super([], options);
    this.builder = builder;
    this.dir = builder.dir;
    this.isAddon = builder.pkg.keywords && builder.pkg.keywords.includes('denali-addon');
    this.files = options.files;
  }

  build() {
    // Copy over any top level files specified
    this.files.forEach((pattern) => {
      glob.sync(pattern, { cwd: this.dir, nodir: true }).forEach((file) => {
        let src = path.join(this.dir, file);
        let dest = path.join(this.outputPath, file);
        if (fs.existsSync(src)) {
          mkdirp.sync(path.dirname(dest));
          fs.writeFileSync(dest, fs.readFileSync(src));
        }
      });
    });

    // Addons should publish their dist directories, not the root project directory.
    // To enforce this, the addon blueprint ships with a prepublish script that
    // fails immediately, telling the user to run `denali publish` instead (which
    // tests the addon, builds it, then runs npm publish from the dist folder).
    // However, Denali itself would get blocked by our prepublish blocker too,
    // so when we build an addon, we remove that blocker. But if the user has
    // changed the prepublish script, then we leave it alone.
    let scripts = this.builder.pkg.scripts;
    if (scripts && scripts.prepublish === 'echo "Use \'denali publish\' instead." && exit 1') {
      let pkg = cloneDeep(this.builder.pkg);
      delete pkg.scripts.prepublish;
      fs.writeFileSync(path.join(this.outputPath, 'package.json'), JSON.stringify(pkg, null, 2));
    }
  }

}
