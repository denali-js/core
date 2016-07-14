const semver = require('semver');

module.exports = function sortVersions(versions) {
  return versions.sort((a, b) => {
    // Two branch names - sort alphabetically
    if (!semver.valid(a.ref) && !semver.valid(b.ref)) {
      if (a < b) { return -1; }
      if (a > b) { return 1; }
      return 0;
    }
    // Branches after semvers
    if (!semver.valid(a.ref)) { return 1; }
    if (!semver.valid(b.ref)) { return -1; }
    // Sort semvers
    return semver.rcompare(a.ref, b.ref);
  });
};
