export default function tryRequire(path) {
  try {
    return require(path);
  } catch (e) {
    if (e.message === `Cannot find module '${ path }'`) {
      return false;
    }
    throw e;
  }
}
