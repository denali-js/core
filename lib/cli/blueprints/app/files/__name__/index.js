require('babel-register');
const Application = require('./app/application');

let application = new Application({
  environment: process.env.DENALI_ENV || process.env.NODE_ENV || 'development',
  dir: __dirname
});

application.start();

module.exports = application;
