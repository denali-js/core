export default function tryRequire(path) {
  try {
    let mod = require(path);
    return mod.default || mod;
  } catch (e) {
    if (e.message === `Cannot find module '${ path }'`) {
      return false;
    }
    throw e;
  }
}
