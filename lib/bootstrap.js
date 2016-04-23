const path = require('path');
const fs = require('fs');
const Container = require('./runtime/container');

let workingDir = process.argv.pop();
process.chdir(workingDir);

// Load the user defined Application, or use the base runtime class
let applicationPath = path.join(process.cwd(), 'app/application');
let Application;
if (fs.existsSync(`${ applicationPath }.js`)) {
  Application = require(applicationPath);
} else {
  Application = require('./runtime/application');
}

let application = new Application({
  container: new Container(),
  environment: process.env.DENALI_ENV || process.env.NODE_ENV || 'development',
  dir: workingDir
});

application.start();

module.exports = application;
