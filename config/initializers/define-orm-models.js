import { each } from 'bluebird';

export default {
  name: 'define-orm-models',
  initialize(application) {
    let adapters = application.container.lookupAll('orm-adapter');
    let models = application.container.lookupAll('model');
    return each(Object.values(adapters), (Adapter) => {
      if (Adapter.hasOwnProperty('defineModels')) {
        Adapter.defineModels(models);
      }
    });
  }
};
