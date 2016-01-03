import DenaliObject from './object';

export default DenaliObject.extend({

  waitFor(...services) {
    return Promise.all(services.map((modulepath) => {
      return this.application.container.services[modulepath].ready;
    }));
  }

});
