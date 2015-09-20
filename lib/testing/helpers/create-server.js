import supertest from 'supertest-as-promised';

export default function createServer() {
  let Application = require('../../runtime/application');
  let application = new Application({ rootDir: process.cwd(), environment: 'test' });
  application.start().then(() => {
    this.server = supertest(application.server);
    this.app = application;
  });
}
