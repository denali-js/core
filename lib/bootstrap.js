import path from 'path';
import fs from 'fs';

let workingDir = process.argv[process.argv.length - 1];
process.chdir(workingDir);

let applicationPath = path.join(process.cwd(), 'app/application');

let Application;
if (fs.existsSync(applicationPath + '.js')) {
  Application = require(applicationPath);
} else {
  Application = require('./runtime/application');
}

let environment = process.env.DENALI_ENV || process.env.NODE_ENV || 'development';

let application = new Application({ environment, dir: workingDir });

application.start();

export default application;
