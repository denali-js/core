import DAG from 'dag-map';

export default function topsort(items, options = {}) {
  let graph = new DAG();
  items.forEach((item) => {
    graph.addEdges(item.name, item[options.valueKey || 'value'], item.before, item.after);
  });
  let sorted = [];
  graph.topsort(({ value }) => {
    sorted.push(value);
  });
  return sorted;
}
