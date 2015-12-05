import findup from 'findup-sync';

/**
 * Returns a Boolean indicating whether or not the supplied directory
 * contains a Denali application. The result is based on whether denali is
 * found as a direct dependency of the package in the directory.
 *
 * @method isDenaliApp
 *
 * @param  {String}  dirpath  The directory containing the application
 *
 * @return {Boolean}  `true` if the directory contains a Denali application
 */
export default function isDenaliApp(dirpath) {
  let pkgpath = findup('package.json', { cwd: dirpath });
  if (pkgpath) {
    let pkg = require(pkgpath);
    return pkg.dependencies && pkg.dependencies.denali;
  } else {
    return false;
  }
}