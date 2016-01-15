import fs from 'fs';
import path from 'path';
import expect from 'must';
import rimraf from 'rimraf';
import { execSync as run } from 'child_process';
import isFile from '../../../lib/utils/is-file';
import isDir from '../../../lib/utils/is-dir';

function expectDir(...dirpath) {
  expect(isDir(path.join(...dirpath))).to.be.true();
}
function expectFile(...filepath) {
  expect(isFile(path.join(...filepath))).to.be.true();
}

const fixtureDir = path.join(__dirname, '..', '..', 'fixtures', 'cli', 'build-acceptance-test');
const bin = path.join(__dirname, '..', '..', '..', 'bin');
const denaliPath = path.join(bin, 'denali');

describe('denali build', function() {

  before(function() {
    this.timeout(10 * 1000);
    run(`${ denaliPath } build`, { cwd: fixtureDir });
    this.distDir = path.join(fixtureDir, 'dist');
  });

  after(function() {
    rimraf.sync(path.join(fixtureDir, 'dist'));
  });

  it('should build the output to the dist dir', function() {
    expectDir(this.distDir);
  });

  it('should create the basic directory structure', function() {
    /* eslint-disable no-multi-spaces */
    expectDir(this.distDir,  'app');
    expectDir(this.distDir,  'app', 'actions');
    expectFile(this.distDir, 'app', 'actions', 'application.js');
    expectFile(this.distDir, 'app', 'actions', 'index.js');
    expectDir(this.distDir,  'app', 'adapters');
    expectFile(this.distDir, 'app', 'adapters', 'application.js');
    expectDir(this.distDir,  'app', 'serializers');
    expectFile(this.distDir, 'app', 'serializers', 'application.js');
    expectFile(this.distDir, 'app', 'application.js');
    expectDir(this.distDir,  'config');
    expectFile(this.distDir, 'config', 'environment.js');
    expectFile(this.distDir, 'config', 'middleware.js');
    expectFile(this.distDir, 'config', 'routes.js');
    /* eslint-enable no-multi-spaces */
  });

  it('should convert es6 -> es5 by default', function() {
    let appContents = fs.readFileSync(path.join(this.distDir, 'app', 'application.js'), 'utf-8');
    expect(appContents).to.not.match(/import/);
  });

});
