export default function(containerpath) {
  return {
    injection: Symbol.for('denali:injection'),
    containerpath
  };
}
