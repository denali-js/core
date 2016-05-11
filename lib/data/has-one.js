class HasOneRelationship {

  type;
  options;

  constructor(type, options = {}) {
    this.type = type;
    this.options = options;
  }

}

export default function hasMany() {
  return new HasOneRelationship(...arguments);
}


