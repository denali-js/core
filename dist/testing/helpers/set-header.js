export default function setHeader(name, value) {
  this.headers = this.headers || {};
  return this.headers[name] = value;
}