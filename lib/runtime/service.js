import ContainerObject from './container-object';
import metaFor from './meta-for';

const Service = ContainerObject.extend({
  toString() {
    return `<${ metaFor(this).containerPath || 'Service' }:${ metaFor(this).id }>`;
  }
});

Service._instantiate = true;
Service._singleton = true;

export default Service;
