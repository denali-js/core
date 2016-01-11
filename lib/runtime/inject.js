export default function inject(fullName) {
  return {
    injection: Symbol.for('denali:object:injection'),
    fullName
  };
}
