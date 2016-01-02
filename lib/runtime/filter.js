import ContainerObject from './container-object';
import metaFor from './meta-for';

export default ContainerObject.extend({
  toString() {
    return `<Filter:${ metaFor(this).id }>`;
  }
});
