import DAG from 'dag-map';

interface Vertex {
  name: string,
  before: string | string[];
  after: string | string[];
  [key: string]: any;
}

export default function topsort(items: Vertex[], options: { valueKey?: string } = {}): any[] {
  let graph = new DAG();
  items.forEach((item) => {
    let value = options.valueKey ? item[options.valueKey] : item;
    graph.add(item.name, value, item.before, item.after);
  });
  let sorted: any[] = [];
  graph.topsort((key, value) => {
    sorted.push(value);
  });
  return sorted;
}
