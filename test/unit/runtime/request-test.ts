/* tslint:disable:completed-docs no-empty no-invalid-this member-access */
import test from 'ava';
import { Request, MockRequest } from 'denali';

function mockRequest(options?: any): Request {
  return new Request(<any>new MockRequest(options));
}

test('method returns correct method', (t) => {
  let request = mockRequest({
    method: 'PUT'
  });
  t.is(request.method, 'PUT');
});

test('query returns parsed query params', (t) => {
  let request = mockRequest({
    url: 'http://example.com?foo=bar&fizz=bat'
  });
  t.is(request.query.foo, 'bar');
  t.is(request.query.fizz, 'bat');
});

test('hostname returns Host header without port number', (t) => {
  let request = mockRequest({
    headers: {
      host: 'example.com:1234'
    }
  });
  t.is(request.hostname, 'example.com');
});

test('hostname doesn\'t fail when host header is not defined', (t) => {
  let request = mockRequest();
  t.is(request.hostname, undefined);
});

test('ip returns remote address of socket', (t) => {
  let request = mockRequest();
  t.is(request.ip, '192.168.1.1');
});

test('protocol', (t) => {
  let httpRequest = mockRequest({
    url: 'http://example.com/'
  });
  let httpsRequest = mockRequest({
    url: 'https://example.com/'
  });

  t.is(httpRequest.protocol, 'http', 'http protocol');
  t.is(httpsRequest.protocol, 'https', 'https protocol');
});

test('xhr returns true for ajax requests', (t) => {
  let request = mockRequest({
    headers: {
      'x-requested-with': 'XMLHttpRequest'
    }
  });

  t.is(request.xhr, true);
});

test('subdomains return an array of subdomains from request url', (t) => {
  let request = mockRequest({
    headers: {
      host: 'a.example.com'
    }
  });
  let request2 = mockRequest({
    headers: {
      host: 'a.b.c.example.com'
    }
  });

  t.deepEqual(request.subdomains, ['a']);
  t.deepEqual(request2.subdomains, ['c', 'b', 'a']);
});

test('get returns header value', (t) => {
  let request = mockRequest({
    headers: {
      foo: 'bar',
      baz: 'qux'
    }
  });

  t.is(request.getHeader('foo'), 'bar');
  t.is(request.getHeader('baz'), 'qux');
});

test('headers returns all request headers', (t) => {
  let request = mockRequest({
    headers: {
      foo: 'bar',
      baz: 'qux'
    }
  });

  t.deepEqual(request.headers, {
    foo: 'bar',
    baz: 'qux'
  });
});

test('accepts returns correct type', (t) => {
  let request = mockRequest({
    headers: {
      accept: 'text/html'
    }
  });
  let request2 = mockRequest({
    headers: {
      accept: 'application/json'
    }
  });

  t.is(request.accepts('json', 'html'), 'html');
  t.is(request2.accepts('json', 'html'), 'json');
});

test('is returns correct values', (t) => {
  let jsonRequest = mockRequest({
    method: 'post',
    headers: {
      'content-type': 'application/json',
      'content-length': 2
    }
  });
  let htmlRequest = mockRequest({
    method: 'post',
    headers: {
      'content-type': 'text/html',
      'content-length': 7
    }
  });

  t.is(jsonRequest.is('html'), false, 'json request is not html');
  t.is(jsonRequest.is('json'), 'json', 'json request is json');
  t.is(htmlRequest.is('html'), 'html', 'html request is html');
  t.is(htmlRequest.is('json'), false, 'html request is not json');
});