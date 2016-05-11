class Attribute {

  type = 'text';
  options;

  constructor(type, options = {}) {
    this.type = type;
    this.options = options;
  }

}

export default function attr() {
  return new Attribute(...arguments);
}
