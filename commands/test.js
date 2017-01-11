import path from 'path';
import dedent from 'dedent-js';
import { spawn } from 'child_process';
import ui from '../lib/cli/ui';
import Command from '../lib/cli/command';
import Project from '../lib/cli/project';
import assign from 'lodash/assign';

export default class TestCommand extends Command {

  static commandName = 'test';
  static description = "Run your app's test suite";
  static longDescription = dedent`
    Runs your app's test suite, and can optionally keep re-running it on each file
    change (--watch).`;

  runsInApp = true;

  params = [ 'files' ];

  flags = {
    debug: {
      description: 'The test file you want to debug. Can only debug one file at a time.',
      defaultValue: null,
      type: String
    },
    watch: {
      description: 'Re-run the tests when the source files change',
      defaultValue: false,
      type: Boolean
    },
    match: {
      description: 'Filter which tests run based on the supplied regex pattern',
      defaultValue: null,
      type: String
    },
    timeout: {
      description: 'Set the timeout for all tests, i.e. --timeout 10s, --timeout 2m',
      defaultValue: null,
      type: String
    },
    'skip-lint': {
      description: 'Skip linting the app source files',
      defaultValue: false,
      type: Boolean
    },
    'skip-audit': {
      description: 'Skip auditing your package.json for vulnerabilites',
      defaultValue: false,
      type: Boolean
    },
    verbose: {
      description: 'Print detailed output of the status of your test run',
      defaultValue: process.env.CI,
      type: Boolean
    },
    output: {
      description: 'The directory to write the compiled app to. Defaults to a tmp directory',
      defaultValue: path.join('tmp', 'test'),
      type: String
    },
    'print-slow-trees': {
      description: 'Print out an analysis of the build process, showing the slowest nodes.',
      defaultValue: false,
      type: Boolean
    },
    'fail-fast': {
      description: 'Stop tests on the first failure',
      defaultValue: false,
      type: Boolean
    },
    litter: {
      description: 'Do not clean up tmp directories created during testing (useful for debugging)',
      defaultValue: false,
      type: Boolean
    },
    serial: {
      description: 'Run tests serially',
      defaultValue: false,
      type: Boolean
    },
    concurrency: {
      description: 'How many test files should run concurrently?',
      defaultValue: 5,
      type: Number
    }
  };

  run({ params, flags }) {
    this.flags = flags;
    flags.watch = flags.watch || flags.environment === 'development';
    this.files = params.files || 'test/**/*.js';

    this.project = new Project({
      environment: 'test',
      printSlowTrees: flags['print-slow-trees'],
      audit: !flags['skip-audit'],
      lint: !flags['skip-lint'],
      buildDummy: true
    });

    process.on('exit', this.cleanExit.bind(this));
    process.on('SIGINT', this.cleanExit.bind(this));
    process.on('SIGTERM', this.cleanExit.bind(this));

    if (this.watch) {
      this.project.watch({
        outputDir: this.output,
        // Don't let broccoli rebuild while tests are still running, or else
        // we'll be removing the test files while in progress leading to cryptic
        // errors.
        beforeRebuild: () => {
          if (this.tests) {
            return new Promise((resolve) => {
              this.tests.removeAllListeners('exit');
              this.tests.on('exit', () => {
                delete this.tests;
                resolve();
              });
              this.tests.kill();
              ui.info('\n\n===> Changes detected, cancelling in-progress tests ...\n\n');
            });
          }
        },
        onBuild: () => {
          this.runTests();
        }
      });
    } else {
      this.project.build(this.output)
      .then(() => {
        this.runTests();
      });
    }
  }

  cleanExit() {
    if (this.tests) {
      this.tests.kill();
    }
  }

  runTests() {
    let avaPath = path.join(process.cwd(), 'node_modules', '.bin', 'ava');
    let args = [ this.files, '!test/dummy/**/*', '--concurrency', this.flags.concurrency ];
    if (this.flags.debug) {
      avaPath = process.execPath;
      args = [ '--inspect', '--debug-brk', path.join(process.cwd(), 'node_modules', 'ava', 'profile.js'), this.flags.debug ];
    }
    if (this.flags.match) {
      args.push('--match', this.flags.match);
    }
    if (this.flags.verbose) {
      args.unshift('--verbose');
    }
    if (this.flags.timeout) {
      args.unshift('--timeout', this.flags.timeout);
    }
    if (this.flags['fail-fast']) {
      args.unshift('--fail-fast');
    }
    if (this.flags.serial) {
      args.unshift('--serial');
    }
    this.tests = spawn(avaPath, args, {
      cwd: this.output,
      stdio: [ 'pipe', process.stdout, process.stderr ],
      env: assign({}, process.env, {
        PORT: this.port,
        DENALI_LEAVE_TMP: this.flags.litter,
        DENALI_ENV: this.project.environment,
        NODE_ENV: this.project.environment,
        DEBUG_COLORS: 1,
        DEBUG_FD: 1
      })
    });
    ui.info(`===> Running ${ this.project.pkg.name } tests ...`);
    this.tests.on('exit', (code) => {
      if (code === 0) {
        ui.success('\n===> Tests passed 👍');
      } else {
        ui.error('\n===> Tests failed 💥');
      }
      delete this.tests;
      if (this.watch) {
        ui.info('===> Waiting for changes to re-run ...\n\n');
      } else {
        process.exitCode = code === null ? 1 : code;
        ui.info(`===> exiting with ${ process.exitCode }`);
      }
    });
  }

}
