import path from 'path';
import { execSync as run, spawn } from 'child_process';
import tmp from 'tmp';

let bin = path.join(__dirname, '..', '..', '..', '..', 'bin');
let denaliPath = path.join(bin, 'denali');

describe('server command', function() {

  before(function() {
    this.timeout(0);
    this.tmpdir = tmp.dirSync({ unsafeCleanup: true }).name;
    run(`${ denaliPath } new foobar`, { cwd: this.tmpdir });
  });

  it('should launch the application server', function() {
    this.timeout(0);
    return new Promise((resolve, reject) => {
      let server = spawn(denaliPath, [ 'server' ], {
        cwd: path.join(this.tmpdir, 'foobar')
      });
      let buffer = '';
      server.on('error', reject);
      server.on('close', reject);
      server.stdout.on('data', (output) => {
        buffer += output;
      });
      server.stderr.on('data', reject);
      let timeout;
      let interval = setInterval(() => {
        if (buffer.indexOf('foobar@0.0.1 server up') > -1) {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve();
        }
      }, 100);
      timeout = setTimeout(() => {
        clearInterval(interval);
        reject();
      }, 10000);
    });
  });

});
