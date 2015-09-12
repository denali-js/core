import findup from 'findup-sync';

export default function isDenaliApp(dirpath) {
  let pkgpath = findup('package.json', { cwd: dirpath });
  if (pkgpath) {
    let pkg = require(pkgpath);
    return pkg.dependencies && pkg.dependencies.denali;
  } else {
    return false;
  }
}
