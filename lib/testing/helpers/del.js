export default function del(url, options) {
  return this.request('delete', url, options);
}
