const fs = require('fs');
const path = require('path');
const expect = require('must');
const tmp = require('tmp');
const run = require('child_process').execSync;
const isFile = require('../../../lib/utils/is-file');

function expectFile(...filepath) {
  expect(isFile(path.join(...filepath))).to.be.true();
}

const bin = path.join(__dirname, '..', '..', '..', 'bin');
const denaliPath = path.join(bin, 'denali');

describe('new command', function() {

  before(function() {
    this.tmpdir = tmp.dirSync();
    run(`${ denaliPath } new foobar`, { cwd: this.tmpdir.name });
  });

  after(function() {
    this.tmpdir.removeCallback();
  });

  it('should generate an addon', function() {
    let indexPath = path.join(this.tmpdir.name, 'foobar', 'index.js');
    expectFile(indexPath);
    let contents = fs.readFileSync(indexPath, 'utf-8');
    expect(contents).to.include('Application');
  });

});
