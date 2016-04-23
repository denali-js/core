const tryRequire = require('denali/utils/try-require');

// Load the user defined Application, or use the base runtime class
const Application = tryRequire('./app/application') || require('denali/runtime/application');

let application = new Application({
  environment: process.env.DENALI_ENV || process.env.NODE_ENV || 'development',
  dir: __dirname
});

application.start();

