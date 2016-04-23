const DAG = require('dag-map');

module.exports = function topsort(items, options = {}) {
  let graph = new DAG();
  items.forEach((item) => {
    let value = options.valueKey ? item[options.valueKey] : item;
    graph.addEdges(item.name, value, item.before, item.after);
  });
  let sorted = [];
  graph.topsort(({ value }) => {
    sorted.push(value);
  });
  return sorted;
};
