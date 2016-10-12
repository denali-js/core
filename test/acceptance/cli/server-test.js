import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

let bin = path.join(__dirname, '..', '..', '..', '..', 'bin');
let denaliPath = path.join(bin, 'denali');
let fixturesDir = path.join(__dirname, '..', '..', 'fixtures');
let basicAppDir = path.join(fixturesDir, 'cli', 'basic-app');

describe('server command', function() {

  before(function() {
    fs.symlinkSync(path.join(process.cwd(), '..'), path.join(basicAppDir, 'node_modules', 'denali'));
  });

  after(function() {
    fs.unlinkSync(path.join(basicAppDir, 'node_modules', 'denali'));
  });

  it('should launch the application server', function() {
    this.timeout(0);
    return new Promise((resolve, reject) => {
      let server = spawn(denaliPath, [ 'server' ], {
        cwd: basicAppDir
      });
      let buffer = '';
      server.on('error', reject);
      server.on('close', () => {
        reject(new Error('Server exited prematurely'));
      });
      server.stderr.on('data', (output) => {
        process.stderr.write(output.toString());
      });
      server.stdout.on('data', (output) => {
        buffer += output.toString();
      });
      let timeout;
      let interval = setInterval(() => {
        if (buffer.indexOf('basic-app@0.0.1 server up') > -1) {
          clearInterval(interval);
          clearTimeout(timeout);
          server.kill();
          resolve();
        }
      }, 100);
      timeout = setTimeout(() => {
        clearInterval(interval);
        server.kill();
        reject();
      }, 10000);
    });
  });

});
