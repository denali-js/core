const sortVersions = require('./sort-versions');
const findKey = require('lodash/findKey');

module.exports = function buildVersionMeta(versions, options) {
  versions = versions.map((version) => {
    return {
      ref: version,
      name: version,
      channel: findKey(options.channels, (value) => value === version)
    };
  });
  versions = sortVersions(versions);
  versions[0].latest = true;
  return versions;
};
