import assert from 'assert';
import Promise from 'bluebird';
import mapValues from 'lodash/object/mapValues';

export default {
  name: 'service-singletons',
  initialize: function createSingletons(application) {
    let servicesMap = application.container.services;
    let serviceInitializers = mapValues(servicesMap, (service) => {
      assert(typeof service !== 'function', 'Services should be defined using Service.create() rather than Service.extend(), since services are singletons.');
      service.application = application;
      service.config = application.config;
      service.ready = new Promise((resolve, reject) => {
        service.makeReady = resolve;
        service.failReady = reject;
      });

      if (typeof service.setup !== 'function') {
        return service.makeReady();
      }
      return Promise.resolve(service.setup())
        .then(service.makeReady)
        .catch(service.failReady);
    });
    return Promise.props(serviceInitializers);
  }
};
