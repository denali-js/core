import path from 'path';

export default function blueprintFor(srcpath) {
  let blueprint = require(path.join(srcpath, 'index.js'));
  blueprint.locals = blueprint.locals || function() { return {}; };
  blueprint.postInstall = blueprint.postInstall || function() {};
  blueprint.postUninstall = blueprint.postInstall || function() {};
  return blueprint;
}
