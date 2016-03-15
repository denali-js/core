import DenaliObject from './object';

export default DenaliObject.extend();

// TODO maybe filters should be specified inline, rather than as mixins, i.e.:
//
//    export default Action.extend({
//      before: ...
//    });
//
// We could use direct references:
//
//    before: AuthenticateFilter
//
// Or lookup names:
//
//    before: 'admin/authenticate' // uses container to lookup actions/admin/-authenticate
//
//
