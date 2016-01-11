import DenaliObject from './object';

const Service = DenaliObject.extend({

  waitFor(...services) {
    return Promise.all(services.map((modulepath) => {
      return this.application.container.services[modulepath].ready;
    }));
  }

});

Service.singleton = true;

export default Service;
