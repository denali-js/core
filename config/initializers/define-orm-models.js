import { all } from 'bluebird';
import forEach from 'lodash/forEach';

export default {
  name: 'define-orm-models',
  initialize(application) {
    let models = application.container.lookupAll('model');
    let modelsGroupedByAdapter = new Map();
    forEach(models, (Model) => {
      let Adapter = application.container.lookup(`orm-adapter:${ Model.type }`);
      if (!modelsGroupedByAdapter.has(Adapter)) {
        modelsGroupedByAdapter.set(Adapter, []);
      }
      modelsGroupedByAdapter.get(Adapter).push(Model);
    });
    let definitions = [];
    modelsGroupedByAdapter.forEach((modelsForThisAdapter, Adapter) => {
      definitions.push(Adapter.defineModels(modelsForThisAdapter));
    });
    return all(definitions);
  }
};
