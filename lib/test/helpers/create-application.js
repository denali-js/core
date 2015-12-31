import path from 'path';
import fs from 'fs';
import supertest from 'supertest';
import state from './global-state';

export default function createApplication() {
  let applicationPath = path.join(process.cwd(), 'app/application');

  let Application;
  if (fs.existsSync(applicationPath + '.js')) {
    Application = require(applicationPath);
  } else {
    Application = require('./runtime/application');
  }

  let environment = process.env.DENALI_ENV || process.env.NODE_ENV || 'test';

  let application = new Application({ environment, dir: process.cwd() });

  return application.start({ bind: false }).then(() => {
    state.application = application;
    state.server = supertest(application.dispatcher);
  });
}
