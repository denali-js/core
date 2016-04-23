const path = require('path');
const rimraf = require('rimraf');
const expect = require('must');
const run = require('child_process').execSync;
const isFile = require('../../../lib/utils/is-file');

function expectFile(...filepath) {
  expect(isFile(path.join(...filepath))).to.be.true();
}
function expectNoFile(...filepath) {
  expect(isFile(path.join(...filepath))).to.not.be.true();
}

const fixtureDir = path.join(__dirname, '..', '..', 'fixtures', 'cli', 'blank-app');
const bin = path.join(__dirname, '..', '..', '..', 'bin');
const denaliPath = path.join(bin, 'denali');

describe('generate', function() {

  before(function() {
    this.actionName = 'my-action-generate-test';
    this.actionPath = path.join(fixtureDir, 'app', 'actions', `${ this.actionName }.js`);
    // ensure proper cleanup from last testing run
    expectNoFile(this.actionPath);
    run(`${ denaliPath } generate action ${ this.actionName }`, { cwd: fixtureDir });
  });

  after(function() {
    rimraf.sync(this.actionPath);
  });

  it('should generate files', function() {
    expectFile(this.actionPath);
  });

});
