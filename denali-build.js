import Builder from './cli/builder';

export default class DenaliBuilder extends Builder {

  babelOptions() {
    let options = super.babelOptions(...arguments);
    options.env = {
      // Add code coverage support
      test: {
        plugins: [ 'istanbul' ]
      }
    };
    return options;
  }

}
