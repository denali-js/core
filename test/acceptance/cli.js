import fs from 'fs';
import path from 'path';
import expect from 'must';
import { exec, execSync as run } from 'child_process';
import axios from 'axios';

const dummyDir = path.join(__dirname, '..', 'cli-dummy');

function fileExists(filepath) {
  return fs.existSync(filepath) && fs.statSync(filepath).isFile();
}

function dirExists(filepath) {
  return fs.existSync(filepath) && fs.statSync(filepath).isDirectory();
}

xdescribe('cli', function() {
  before(function() {
    process.chdir(path.join(dummyDir, '..'));
    run('denali new dummy --skip-npm');
  });

  describe('new', function() {
    it('should create a new app folder', function() {
      expect(dirExists(dummyDir)).to.be.true();
    });

    it('should create the basic directory structure', function() {
      expect(dirExists(path.join(dummyDir, 'app'))).to.be.true();
      expect(dirExists(path.join(dummyDir, 'app', 'actions'))).to.be.true();
      expect(fileExists(path.join(dummyDir, 'app', 'actions', 'application.js'))).to.be.true();
      expect(fileExists(path.join(dummyDir, 'app', 'actions', 'index.js'))).to.be.true();
      expect(dirExists(path.join(dummyDir, 'app', 'adapters'))).to.be.true();
      expect(fileExists(path.join(dummyDir, 'app', 'adapters', 'application.js'))).to.be.true();
      expect(dirExists(path.join(dummyDir, 'app', 'serializers'))).to.be.true();
      expect(fileExists(path.join(dummyDir, 'app', 'serializers', 'application.js'))).to.be.true();
      expect(dirExists(path.join(dummyDir, 'app', 'services'))).to.be.true();
      expect(fileExists(path.join(dummyDir, 'app', 'application.js'))).to.be.true();
      expect(dirExists(path.join(dummyDir, 'config'))).to.be.true();
      expect(fileExists(path.join(dummyDir, 'config', 'environment.js'))).to.be.true();
      expect(fileExists(path.join(dummyDir, 'config', 'middleware.js'))).to.be.true();
      expect(fileExists(path.join(dummyDir, 'config', 'routes.js'))).to.be.true();
      expect(dirExists(path.join(dummyDir, 'test'))).to.be.true();
    });
  });

  describe('generate', function() {
    after(function() {
      fs.unlinkSync(path.join(dummyDir, 'app', 'actions', 'generate-test.js'));
    });

    it('should generate files', function() {
      run('denali generate action generate-test');
      expect(fileExists(path.join(dummyDir, 'app', 'actions', 'generate-test.js'))).to.be.true();
    });
  });

  describe('destroy', function() {
    before(function() {
      run('denali generate action destroy-test');
    });

    it('should remove generated files', function() {
      run('denali destroy action destroy-test');
      expect(fileExists(path.join(dummyDir, 'app', 'actions', 'destroy-test.js'))).to.be.false();
    });
  });

  describe('doc', function() {
    it('should generate docs');
  });

  describe('install', function() {
    it('should install denali addons');
  });

  describe('server', function() {
    it('should serve the app', function() {
      let server = exec('denali server');
      return axios.get('http://localhost:3000/')
        .then((response) => {
          let status = JSON.parse(response).status;
          expect(status).to.be('okay');
        }).finally(() => {
          server.kill();
        });
    });
  });

  describe('test', function() {
    it('should test the app', function() {
      let result = run('denali test');
      expect(result).to.be.true();
    });
  });

});
