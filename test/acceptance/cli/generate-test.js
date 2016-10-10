import path from 'path';
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

describe('generate', function() {

  before(function() {
    this.timeout(20000);
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
