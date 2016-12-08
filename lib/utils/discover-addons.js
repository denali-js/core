import path from 'path';
import fs from 'fs';
import resolve from 'resolve';
import findup from 'findup-sync';
import createDebug from 'debug';
import find from 'lodash/find';
import forIn from 'lodash/forIn';
import topsort from './topsort';

const debug = createDebug('denali:utils:discover-addons');

export default function discoverAddons(dir = process.cwd(), options = {}) {
  options.preseededAddons = options.preseededAddons || [];
  options.root = options.root || dir;
  let displayDir = options.root ? `./${ path.relative(options.root, dir) }` : dir;

  let addons = options.preseededAddons.map((addonDir) => {
    let pkg = require(path.join(addonDir, 'package.json'));
    debug(`preseeding ${ pkg.name } for ${ displayDir }`);
    return {
      dir: addonDir,
      pkg
    };
  });

  let pkg = require(path.join(dir, 'package.json'));
  forIn(pkg.dependencies, (version, pkgName) => {
    // Ensure that we don't attempt to load a preseeded addon
    let preseedConflict = find(addons, (addon) => addon.pkg.name === pkgName);
    if (preseedConflict) {
      return;
    }
    let pkgMainPath = resolve.sync(pkgName, { basedir: fs.realpathSync(dir) });
    let pkgJSONPath = path.resolve(findup('package.json', { cwd: pkgMainPath }));
    let pkgDir = path.dirname(pkgJSONPath);
    let addonPkg = require(pkgJSONPath);
    let isDenaliAddon = addonPkg.keywords && addonPkg.keywords.includes('denali-addon');

    if (isDenaliAddon) {
      addons.push({ pkg: addonPkg, dir: pkgDir });
    }
  });

  // Transform into topsort-able format
  addons = addons.map((addon) => {
    let loadOptions = addon.pkg.denali || {};
    return {
      name: addon.pkg.name,
      value: addon.dir,
      before: loadOptions.before,
      after: loadOptions.after
    };
  });

  debug(`found ${ addons.length } addons in ${ displayDir }: [ ${ addons.map((a) => a.name).join(', ') } ]`);

  return topsort(addons, { valueKey: 'value' });
}
