require('source-map-support').install();
const path = require('path');
const Application = require('./dist/app/application').default;

let application = new Application({
  environment: process.env.DENALI_ENV || process.env.NODE_ENV || 'development',
  dir: path.join(process.cwd(), 'dist')
});

application.start();

module.exports = application;
