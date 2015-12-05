import { singularize, pluralize } from 'inflection';

export default {
  locals(args) {
    return {
      name: singularize(args[0]),
      pluralName: pluralize(args[0])
    };
  }
};