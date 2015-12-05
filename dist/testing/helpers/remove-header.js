export default function removeHeader(name) {
  return delete this.headers[name];
}