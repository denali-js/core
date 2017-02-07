import * as fs from 'fs';
import * as assert from 'assert';
import * as path from 'path';
import { exec, spawn, ChildProcess } from 'child_process';
import * as tmp from 'tmp';
import dedent from 'dedent-js';
import copyDir from '../utils/copy-dir';
import * as createDebug from 'debug';
import DenaliObject from '../metal/object';

const debug = createDebug('denali:test:command-acceptance');

export default class CommandAcceptanceTest extends DenaliObject {

  command: string;
  dir: string;
  environment: string;
  projectRoot: string;
  projectPkg: any;
  denaliPath: string;

  spawnedCommand: ChildProcess;
  pollOutput: NodeJS.Timer;
  fallbackTimeout: NodeJS.Timer;

  constructor(command: string, options: { dir?: string, environment?: string, name?: string, populateWithDummy?: boolean } = {}) {
    super();
    this.command = command;
    this.dir = options.dir || (<any>tmp.dirSync({
      unsafeCleanup: !process.env.DENALI_LEAVE_TMP,
      template: path.resolve(`../test-${ options.name || 'command-acceptance' }-XXXXXX`)
    })).name;
    this.environment = options.environment || 'development';
    this.projectRoot = path.dirname(path.dirname(process.cwd()));
    this.projectPkg = require(path.join(this.projectRoot, 'package.json'));
    this.denaliPath = path.join(this.projectRoot, 'node_modules', 'denali', 'bin', 'denali');

    // This is a special case for when we are running Denali's own test suite.
    // In _every_ other scenario (app or addon running tests), Denali would be
    // a dependency, and therefore node_modules/.bin/denali should exist. But
    // when running Denali's own test suite, that won't exist, since Denali
    // isn't a dependency of itself. So we special case this to find the actual
    // executable instead.
    if (!fs.existsSync(this.denaliPath)) {
      this.denaliPath = path.join(process.cwd(), 'node_modules', 'denali', 'bin', 'denali');
    }

    if (options.populateWithDummy !== false) {
      this.populateWithDummy();
    }
  }

  populateWithDummy(): void {
    debug(`populating tmp directory for "${ this.command }" command with dummy app`);
    let dummy = path.join(this.projectRoot, 'test', 'dummy');
    let tmpNodeModules = path.join(this.dir, 'node_modules');
    assert(!fs.existsSync(tmpNodeModules), 'You tried to run a CommandAcceptanceTest against a directory that already has an app in it. Did you forget to specify { populateWithDummy: false }?');
    // Copy over the dummy app
    copyDir(dummy, this.dir);
    // Symlink the addon itself as a dependency of the dummy app. The compiled
    // dummy app will have the compiled addon it it's node_modules
    fs.mkdirSync(tmpNodeModules);
    fs.symlinkSync(path.join(this.projectRoot, 'tmp', 'test', 'node_modules', this.projectPkg.name), path.join(tmpNodeModules, this.projectPkg.name));
    debug('tmp directory populated');
  }

  run(options: { failOnStderr?: boolean, env?: any } = {}): Promise<{ stdout: string, stderr: string, dir: string }> {
    return new Promise((resolve, reject) => {
      exec(`${ this.denaliPath } ${ this.command }`, {
        env: Object.assign({}, process.env, {
          DENALI_ENV: this.environment,
          NODE_ENV: this.environment
        }, options.env || {}),
        cwd: this.dir
      }, (err, stdout, stderr) => {
        if (err || (options.failOnStderr && stderr.length > 0)) {
          err = err || new Error();
          err.message += dedent`
            ====> stdout:
            ${ stdout }
            ====> stderr:
            ${ stderr }
          `;
          return reject(err);
        }
        resolve({ stdout, stderr, dir: this.dir });
      });
    });
  }

  spawn(options: {
    checkOutput: (stdout: string, stderr: string, dir: string) => boolean,
    failOnStderr?: boolean,
    env?: any,
    pollInterval: number,
    timeout: number
  }): Promise<void> {
    return <any>new Promise((resolve, reject) => {

      this.spawnedCommand = spawn(this.denaliPath, this.command.split(' '), {
        env: Object.assign({}, process.env, {
          DENALI_ENV: this.environment,
          NODE_ENV: this.environment
        }, options.env || {}),
        cwd: this.dir,
        stdio: 'pipe'
      });

      // Cleanup spawned processes if our process is killed
      let cleanup = this.cleanup.bind(this);
      process.on('exit', cleanup.bind(this));

      // Buffer up the output so the polling timer can check it
      let stdoutBuffer = '';
      let stderrBuffer = '';
      this.spawnedCommand.stdout.on('data', (d) => {
        stdoutBuffer += d.toString();
      });
      this.spawnedCommand.stderr.on('data', (d) => {
        stderrBuffer += d.toString();
      });

      // Handle errors from the child process
      this.spawnedCommand.stdout.on('error', reject);
      this.spawnedCommand.stderr.on('error', reject);
      this.spawnedCommand.on('error', reject);

      // Poll periodically to check the results
      this.pollOutput = setInterval(() => {
        if (stderrBuffer.length > 0 && options.failOnStderr) {
          process.removeListener('exit', cleanup);
          this.cleanup();
          let error = new Error('Command printed to stderr, and failOnStderr enabled:\n');
          error.message += dedent`
            ====> stdout:
            ${ stdoutBuffer }
            ====> stderr:
            ${ stderrBuffer }
          `;
          reject(error);
        }
        let passed = options.checkOutput(stdoutBuffer, stderrBuffer, this.dir);
        if (passed) {
          process.removeListener('exit', cleanup);
          this.cleanup();
          resolve();
        }
      }, options.pollInterval || 50);

      // Ensure the test fails if we don't pass the test after a while
      let timeout = options.timeout || (process.env.CI ? 10 * 60 * 1000 : 3 * 60 * 1000);
      this.fallbackTimeout = setTimeout(() => {
        process.removeListener('exit', cleanup);
        this.cleanup();
        let message = `Timeout of ${ (timeout / 1000) / 60 } minutes exceeded for spawned command: ${ this.command }\n`;
        message += dedent`
          ====> stdout:
          ${ stdoutBuffer }
          ====> stderr:
          ${ stderrBuffer }
        `;
        reject(new Error(message));
      }, timeout);

    });
  }

  cleanup() {
    this.spawnedCommand.kill();
    clearInterval(this.pollOutput);
    clearTimeout(this.fallbackTimeout);
  }

}
