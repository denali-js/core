import test from 'ava';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import tmp from 'tmp';
import walkSync from 'walk-sync';

export class BlueprintAcceptanceTest {

  constructor(blueprintName) {
    this.blueprintName = blueprintName;

    // Create a tmp copy of our dummy app to test our blueprint against
    let dummyDir = path.join(__dirname, '..', '..', 'test', 'dummy');
    this.dir = tmp.dirSync({ unsafeCleanup: true }).name;
    walkSync(dummyDir).forEach((dummyFile) => {
      fs.writeFileSync(path.join(this.dir, dummyFile), fs.readFileSync(path.join(dummyDir, dummyFile)));
    });
  }

  generate() {
    return new Promise((resolve, reject) => {
      let denaliPath = path.join(process.cwd(), 'node_modules', '.bin', 'denali');
      exec(`${ denaliPath } generate ${ this.blueprintName }`, {
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

  destroy() {
    return new Promise((resolve, reject) => {
      let denaliPath = path.join(process.cwd(), 'node_modules', '.bin', 'denali');
      exec(`${ denaliPath } destroy ${ this.blueprintName }`, {
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
}

export default function blueprintAcceptanceTest(blueprintName, tests) {
  test.beforeEach('setup blueprint acceptance test', (t) => {
    t.context.blueprint = new BlueprintAcceptanceTest(blueprintName);
  });
  tests();
}
