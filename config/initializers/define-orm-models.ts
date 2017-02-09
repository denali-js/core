import { all } from 'bluebird';
import Application from '../../lib/runtime/application';
import {
  forEach
} from 'lodash';

export default {
  name: 'define-orm-models',
  initialize(application: Application) {
    let models = application.container.lookupAll('model');
    let modelsGroupedByAdapter = new Map();
    forEach(models, (Model) => {
      let Adapter = application.container.lookup(`orm-adapter:${ Model.type }`);
      if (!modelsGroupedByAdapter.has(Adapter)) {
        modelsGroupedByAdapter.set(Adapter, []);
      }
      modelsGroupedByAdapter.get(Adapter).push(Model);
    });
    let definitions: any[] = [];
    modelsGroupedByAdapter.forEach((modelsForThisAdapter, Adapter) => {
      definitions.push(Adapter.defineModels(modelsForThisAdapter));
    });
    return all(definitions);
  }
};
