/**
 * @module denali
 * @submodule runtime
 */

/**
 * LazyExports provide a convenient way of creating classes or modules that
 * must be lazily defined.
 *
 * The classic example of this is a LazyExport representing a Model class.
 * Many Node ORMs require instantiating some kind of global manager object
 * with connection information before Model classes can even be _defined_:
 *
 *     import MyORM from 'my-orm';
 *
 *     const orm = new MyORM(host);
 *     export const User = orm.defineModel('user', { ... });
 *
 * This would normally be problematic when integrating with Denali. You might
 * try importing the above User model directly:
 *
 *     import { User } from '../models';
 *     export default Action.extend({
 *       respond() {
 *         return User.find();
 *       }
 *     });
 *
 * But since imports happen synchronously, Denali may not have finished
 * loading the database configuration by the time the ORM is instantiating,
 * making it impossible to define models.
 *
 * LazyExports solve this problem by representing an object that is defined the
 * first time it is used (lazily) rather than when it's first loaded (eagerly):
 *
 *     // lib/orm.js
 *     import { LazyExport } from 'denali';
 *     export default LazyExport(function(container) {
 *       let config = container.lookup('config:environment');
 *       return new MyORM(config.dbHost);
 *     });
 *
 * And for each model:
 *
 *     // models/user.js
 *     import { LazyExport } from 'denali';
 *     export default LazyExport(function(container) {
 *     	 let orm = container.lookup('lib:orm');
 *       return orm.defineModel('user', { ... });
 *     });
 *
 * Then, in your actions, you can just inject the model:
 *
 *     // actions/users/list.js
 *     export default Action.extend({
 *       User: inject('model:user'),
 *       respond() {
 *         return this.User.find();
 *       }
 *     });
 *
 * Note that in the above example, `this.User` is _not_ a LazyExport. It is the
 * Model class returned from the LazyExport's method. This is because
 * LazyExports overwrite their container entries the first time they are
 * fetched, so their injected value is just their return value.
 *
 * Also note that LazyExports cannot be imported via standard Node import /
 * require methods, since that would import the LazyExport itself. They must be
* accessed via the container.
 *
 * @class LazyExport
 * @constructor
 */
export default function LazyExport(build) {
  return {
    build,
    __lazy: true
  };
}
