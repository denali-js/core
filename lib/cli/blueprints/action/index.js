const Blueprint = require('../../lib/blueprint');

module.exports = Blueprint.extend({
  locals(args) {
    return {
      name: args[0]
    };
  }
});
