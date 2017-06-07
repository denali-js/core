import Service from '../runtime/service';
import Model from './model';

export default class DatabaseService extends Service {

  find(modelType: string, id: any): Promise<Model|null> {
    let ModelClass = <typeof Model>this.container.factoryFor(`model:${ modelType }`).class;
    return ModelClass.find(this.container, id);
  }

  queryOne(modelType: string, query: any): Promise<Model|null> {
    let ModelClass = <typeof Model>this.container.factoryFor(`model:${ modelType }`).class;
    return ModelClass.queryOne(this.container, query);
  }

  query(modelType: string, query: any): Promise<Model[]> {
    let ModelClass = <typeof Model>this.container.factoryFor(`model:${ modelType }`).class;
    return ModelClass.query(this.container, query);
  }

  all(modelType: string): Promise<Model[]> {
    let ModelClass = <typeof Model>this.container.factoryFor(`model:${ modelType }`).class;
    return ModelClass.all(this.container);
  }

  create(modelType: string, data: any): Model {
    return this.container.factoryFor(`model:${ modelType }`).create(this.container, data);
  }

}
