const Blueprint = require('../../lib/blueprint');
const inflection = require('inflection');
const singularize = inflection.singularize;
const pluralize = inflection.pluralize;

module.exports = Blueprint.extend({
  locals(args) {
    return {
      name: singularize(args[0]),
      pluralName: pluralize(args[0])
    };
  }
});
