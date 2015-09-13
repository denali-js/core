import assert from 'assert';
import express from 'express';
import Promise from 'bluebird';
import { log } from '../utils';

import Engine from './engine';

export default Engine.extend({

  init() {
    this._super.apply(this, arguments);
    this.router = new express.Router();
    this.mountConfig(this);
    this.mountInitializers(this);
    this.mountMiddleware(this);
    this.mountAdapters(this);
    this.mountControllers(this);
    this.mountJobs(this);
    this.mountSerializers(this);
    this.mountRoutes(this);
  },

  start() {
    return Promise.resolve(this.initializers)
      .each((initializer) => {
        return initializer(this);
      }).then(() => {
        return this.launchServer();
      });
  },

  launchServer() {
    return new Promise((resolve) => {
      this.server = express();
      this.server.use(this.router);
      this.server.listen(3000, resolve);
    }).then(() => {
      log(`${ this.pkg.name }@${ this.pkg.version } server up on port 3000`);
    });
  },

  handle(controllerAction) {
    let [ controllerName, actionName ] = controllerAction.split('.');
    let controller = this.controllers[controllerName];
    assert(controller, `Attempted to route to ${ controllerAction }, but ${ controllerName } controller not found.`);
    return controller.action.bind(controller, actionName);
  }

});
