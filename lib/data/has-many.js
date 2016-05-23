class HasManyRelationship {

  isRelationship = true;
  type;
  options;

  constructor(type, options = {}) {
    this.type = type;
    this.options = options;
  }

}

export default function hasMany() {
  return new HasManyRelationship(...arguments);
}

