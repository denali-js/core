/**
 * @module denali
 * @submodule testing
 */
const path = require('path');
const fs = require('fs');
const supertest = require('supertest');
const state = require('./global-state');

/**
 * Creates an instance of the application, and populates the testing global
 * state with that instance wrapped in supertest.
 *
 * @method createApplication
 * @return {Promise} resolves once the application is launched
 * @for Denali.Testing.helpers
 */
module.exports = function createApplication() {
  let applicationPath = path.join(process.cwd(), 'app/application');

  let application;
  if (fs.existsSync(`${ applicationPath }.js`)) {
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
};
