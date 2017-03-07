import DAG from 'dag-map';

export interface Vertex {
  name: string;
  before: string | string[];
  after: string | string[];
  [key: string]: any;
}

/**
 * Take an array of vertices (objects with a name, value, and optional before / after), create a
 * directed acyclic graph of them, and return the vertex values in a sorted array.
 *
 * @package util
 */
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
