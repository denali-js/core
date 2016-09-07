const sortVersions = require('./sort-versions');

module.exports = function buildVersionMeta(versions, options) {
  versions = versions.map((version) => {
    return {
      ref: version,
      name: options.rename[version] || version
    };
  });
  versions = sortVersions(versions);
  versions[0].latest = true;
  return versions;
};
