import path from 'path';
import fs from 'fs';

let applicationPath = path.join(process.cwd(), 'app/application');

let Application;
if (fs.existSync(applicationPath)) {
  Application = require(applicationPath);
} else {
  Application = require('./runtime/application');
}

let environment = process.env.DENALI_ENV || process.env.NODE_ENV || 'development';

let application = new Application({ environment });

application.start();

export default application;
