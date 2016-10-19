import test from 'ava';
import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import tmp from 'tmp';
import walkSync from 'walk-sync';

export class CommandAcceptanceTest {

  constructor(command) {
    this.command = command;

    // Create a tmp copy of our dummy app to test our blueprint against
    let dummyDir = path.join(__dirname, '..', '..', 'test', 'dummy');
    this.dir = tmp.dirSync({ unsafeCleanup: true }).name;
    walkSync(dummyDir).forEach((dummyFile) => {
      fs.writeFileSync(path.join(this.dir, dummyFile), fs.readFileSync(path.join(dummyDir, dummyFile)));
    });
  }

  run() {
    return new Promise((resolve, reject) => {
      let denaliPath = path.join(process.cwd(), 'node_modules', '.bin', 'denali');
      exec(`${ denaliPath } ${ this.command }`, {
        cwd: this.dir
      }, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        }
        if (stderr) {
          reject(new Error(stderr));
        }
        resolve(stdout);
      });
    });
  }

  spawn(options = {}) {
    return new Promise((resolve, reject) => {
      let denaliPath = path.join(process.cwd(), 'node_modules', '.bin', 'denali');
      this.spawnedCommand = spawn(denaliPath, this.command.split(' '), {
        cwd: this.dir,
        stdio: 'pipe'
      });
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
        options.checkOutput(stdoutBuffer, stderrBuffer);
      }, options.pollInterval || 50);
      // Ensure the test fails if we don't pass the test after a while
      this.fallbackTimeout = setTimeout(() => {
        reject(new Error(`Timeout exceeded for spawned command: ${ this.command }`));
      }, options.timeout || 10000);
    });
  }

  cleanup() {
    this.spawnedCommand.kill();
    clearInterval(this.pollOutput);
  }

}

export default function commandAcceptanceTest(command, tests) {
  test.beforeEach('setup command acceptance test', (t) => {
    t.context.command = new CommandAcceptanceTest(command);
  });
  test.afterEach.always('teardown any long running spawned commands', (t) => {
    t.context.command.cleanup();
  });
  tests();
}
