export default function patch(url, body, options = {}) {
  options.body = body;
  return this.request('patch', url, options);
}
