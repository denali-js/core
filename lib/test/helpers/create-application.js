import path from 'path';
import fs from 'fs';
import supertest from 'supertest';
import state from './global-state';

export default function createApplication() {
  let applicationPath = path.join(process.cwd(), 'app/application');

  let application;
  if (fs.existsSync(applicationPath + '.js')) {
    application = require(applicationPath);
  } else {
    application = require('./runtime/application').create({
      environment: process.env.DENALI_ENV || process.env.NODE_ENV || 'test'
    });
  }

  return application.start({ bind: false }).then(() => {
    state.application = application;
    state.server = supertest(application.dispatcher);
  });
}
