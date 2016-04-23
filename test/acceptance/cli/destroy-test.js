const fs = require('fs');
const path = require('path');
const faker = require('faker');
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

describe('destroy', function() {

  before(function() {
    this.actionName = 'my-action-destroy-test';
    this.actionPath = path.join(fixtureDir, 'app', 'actions', `${ this.actionName }.js`);
    // ensure proper cleanup from last testing run
    expectNoFile(this.actionPath);
    run(`${ denaliPath } generate action ${ this.actionName }`, { cwd: fixtureDir });
    run(`${ denaliPath } destroy action ${ this.actionName }`, { cwd: fixtureDir });
  });

  after(function() {
    rimraf.sync(this.actionPath);
  });

  it('should remove generated files', function() {
    expectNoFile(this.actionPath);
  });

  describe('when files have been modified', function() {

    before(function() {
      run(`${ denaliPath } generate action ${ this.actionName }`, { cwd: fixtureDir });
      fs.appendFileSync(this.actionPath, faker.hacker.noun());
      run(`${ denaliPath } destroy action ${ this.actionName }`, { cwd: fixtureDir });
    });

    it('should not remove them', function() {
      expectFile(this.actionPath);
    });

  });

});
