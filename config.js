module.exports = {
  data: {
    repo: 'denali-js/denali',
    baseurl: '/',
    url: 'http://localhost:4400'
  },
  versions: {
    branches: [
      'master'
    ],
    skipTags: [
      '<0.0.21'
    ],
    channels: {
      canary: 'v0.0.21'
    },
    alias: {
      latest(versions) {
        return versions[0];
      }
    }
  }
};
