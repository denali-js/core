import fs from 'fs';
import path from 'path';
import expect from 'must';
import tmp from 'tmp';
import { execSync as run } from 'child_process';
import isFile from '../../../lib/utils/is-file';

function expectFile(...filepath) {
  expect(isFile(path.join(...filepath))).to.be.true();
}

let bin = path.join(__dirname, '..', '..', '..', '..', 'bin');
let denaliPath = path.join(bin, 'denali');

describe('addon command', function() {

  before(function() {
    this.timeout(20000);
    this.tmpdir = tmp.dirSync({ unsafeCleanup: true });
    run(`${ denaliPath } addon foobar --skip-npm`, { cwd: this.tmpdir.name });
  });

  after(function() {
    this.tmpdir.removeCallback();
  });

  it('should generate an addon', function() {
    let addonPath = path.join(this.tmpdir.name, 'foobar', 'app', 'addon.js');
    expectFile(addonPath);
    let contents = fs.readFileSync(addonPath, 'utf-8');
    expect(contents).to.include('Addon');
  });

});
