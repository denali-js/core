import DenaliObject from '../metal/object';

export class Descriptor extends DenaliObject {

  public type: string;

  public options: any;

  /**
   * Creates an instance of Descriptor.
   *
   * @param {string} type
   * @param {*} [options]
   */
  constructor(type: string, options?: any) {
    super();
    this.type = type;
    this.options = options;
  }

}

/**
 * The Attribute class is used to tell Denali what the available attributes are
 * on your Model. You shouldn't use the Attribute class directly; instead,
 * import the `attr()` method from Denali, and use it to define an attribute:
 *
 *     import { attr } from 'denali';
 *     class Post extends ApplicationModel {
 *       static title = attr('text');
 *     }
 *
 * Note that attributes must be defined as `static` properties on your Model
 * class.
 *
 * The `attr()` method takes two arguments:
 *
 *   * `type` - a string indicating the type of this attribute. Denali doesn't
 *   care what this string is. Your ORM adapter should specify what types it
 *   expects.
 *   * `options` - any additional options for this attribute. At the moment,
 *   these are used solely by your ORM adapter, there are no additional options
 *   that Denali expects itself.
 *
 * @class Attribute
 * @extends {Descriptor}
 * @module denali
 * @submodule data
 */
class Attribute extends Descriptor {

  /**
   * @type {boolean}
   */
  public isAttribute: boolean = true;

}

export function attr(type: string, options: any) {
  return new Attribute(type, options);
}


/**
 * The HasManyRelationship class is used to describe a 1 to many or many to many
 * relationship on your Model. You shouldn't use the HasManyRelationship class
 * directly; instead, import the `hasMany()` method from Denali, and use it to
 * define a relationship:
 *
 *     import { hasMany } from 'denali';
 *     class Post extends ApplicationModel {
 *       static comments = hasMany('comment');
 *     }
 *
 * Note that relationships must be defined as `static` properties on your Model
 * class.
 *
 * The `hasMany()` method takes two arguments:
 *
 *   * `type` - a string indicating the type of model for this relationship.
 *   * `options` - any additional options for this attribute. At the moment,
 *   these are used solely by your ORM adapter, there are no additional options
 *   that Denali expects itself.
 *
 * @export
 * @class HasManyRelationship
 * @extends {Descriptor}
 * @module denali
 * @submodule data
 */
export class HasManyRelationship extends Descriptor {

  /**
   * @type {boolean}
   */
  public isRelationship: boolean = true;

  /**
   * @type {('hasMany' | 'hasOne')}
   */
  public mode: 'hasMany' | 'hasOne' = 'hasMany';

}

export function hasMany(type: string, options: any) {
  return new HasManyRelationship(type, options);
}

/**
 * The HasOneRelationship class is used to describe a 1 to many or 1 to 1
 * relationship on your Model. You shouldn't use the HasOneRelationship class
 * directly; instead, import the `hasOne()` method from Denali, and use it to
 * define a relationship:
 *
 *     import { hasOne } from 'denali';
 *     class Post extends ApplicationModel {
 *       static author = hasOne('user');
 *     }
 *
 * Note that relationships must be defined as `static` properties on your Model
 * class.
 *
 * The `hasOne()` method takes two arguments:
 *
 *   * `type` - a string indicating the type of model for this relationship.
 *   * `options` - any additional options for this attribute. At the moment,
 *   these are used solely by your ORM adapter, there are no additional options
 *   that Denali expects itself.
 *
 * @class HasOneRelationship
 * @constructor
 * @module denali
 * @submodule data
 */
class HasOneRelationship extends Descriptor {

  /**
   * @type {boolean}
   */
  public isRelationship: boolean = true;

  /**
   * @type {('hasMany' | 'hasOne')}
   */
  public mode: 'hasMany' | 'hasOne' = 'hasOne';

}

export function hasOne(type: string, options: any) {
  return new HasOneRelationship(type, options);
}

export type RelationshipDescriptor = HasManyRelationship | HasOneRelationship;
