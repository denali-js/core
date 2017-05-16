import Service from '../runtime/service';
import Model from './model';

export default class DatabaseService extends Service {

  find(modelType: string, id: any): Promise<Model|null> {
    let Model = this.container.lookup(`model:${ modelType }`);
    return Model.find(this.container, id);
  }

  findOne(modelType: string, query: any): Promise<Model|null> {
    let Model = this.container.lookup(`model:${ modelType }`);
    return Model.findOne(this.container, query);
  }

  query(modelType: string, query: any): Promise<Model[]> {
    let Model = this.container.lookup(`model:${ modelType }`);
    return Model.query(this.container, query);
  }

  all(modelType: string): Promise<Model[]> {
    let Model = this.container.lookup(`model:${ modelType }`);
    return Model.all(this.container);
  }

}
