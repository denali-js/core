import forEach from 'lodash/collection/forEach';

export default {
  name: 'blackburn-singletons',
  initialize: function createSingletons(application) {
    [ 'adapters', 'serializers' ].forEach((type) => {
      let typeMap = application.container[type];
      forEach(typeMap, (ModuleClass, modulepath) => {
        typeMap[modulepath] = new ModuleClass({
          [type]: typeMap
        });
      })
    });
  }
};
