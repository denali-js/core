import { Adapter } from 'denali';

export default Adapter.extend({

  typeForRecord(/* record */) {
    /* retun the type of the record */
  },

  idForRecord(/* record */) {
    /* return the id of the record */
  },

  attributeFromRecord(/* record, attributeName */) {
    /* return the value of the `attributeName` attributeName */
  },

  relationshipFromRecord(/* record, name, config */) {
    /* the return value typically depends on the config.strategy property:
     *
     *   'id' - return the id of the related record, i.e. book.author_id
     *   'ids' - return the ids of the related records, i.e. book.review_ids
     *   'record' - return the actual related record instance itself
     *   'records' - return the actual related record instances themselves
     */
  }

});
