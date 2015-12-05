export default function post(url, body, options = {}) {
  options.body = body;
  return this.request('post', url, options);
}