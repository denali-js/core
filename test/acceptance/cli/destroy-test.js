import fs from 'fs';
import path from 'path';
import faker from 'faker';
import rimraf from 'rimraf';
import expect from 'must';
import { execSync as run } from 'child_process';
import isFile from '../../../lib/utils/is-file';

function expectFile(...filepath) {
  expect(isFile(path.join(...filepath))).to.be.true();
}
function expectNoFile(...filepath) {
  expect(isFile(path.join(...filepath))).to.not.be.true();
}

let fixtureDir = path.join(__dirname, '..', '..', 'fixtures', 'cli', 'blank-app');
let bin = path.join(__dirname, '..', '..', '..', '..', 'bin');
let denaliPath = path.join(bin, 'denali');

describe('destroy', function() {

  before(function() {
    this.timeout(20000);
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
      this.timeout(20000);
      run(`${ denaliPath } generate action ${ this.actionName }`, { cwd: fixtureDir });
      fs.appendFileSync(this.actionPath, faker.hacker.noun());
      run(`${ denaliPath } destroy action ${ this.actionName }`, { cwd: fixtureDir });
    });

    it('should not remove them', function() {
      expectFile(this.actionPath);
    });

  });

});
