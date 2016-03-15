import path from 'path';
import fs from 'fs';
import Container from './runtime/container';

const workingDir = process.argv.pop();
process.chdir(workingDir);

// Load the user defined Application, or use the base runtime class
const applicationPath = path.join(process.cwd(), 'app/application');
let Application;
if (fs.existsSync(applicationPath + '.js')) {
  Application = require(applicationPath);
} else {
  Application = require('./runtime/application');
}

const application = new Application({
  container: new Container(),
  environment: process.env.DENALI_ENV || process.env.NODE_ENV || 'development',
  dir: workingDir
});

application.start();

export default application;
