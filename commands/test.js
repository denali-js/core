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
      description: 'Run the server in debug mode',
      defaultValue: false,
      type: Boolean
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
      defaultValue: false,
      type: Boolean
    },
    output: {
      description: 'The directory to write the compiled app to. Defaults to a tmp directory',
      defaultValue: 'dist',
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
    serial: {
      description: 'Run tests serially',
      defaultValue: false,
      type: Boolean
    }
  };

  run({ params, flags }) {
    this.files = params.files || 'test/**/*.js';
    this.watch = flags.watch || flags.environment === 'development';
    this.port = flags.port;
    this.debug = flags.debug;
    this.match = flags.match;
    this.output = flags.output;
    this.verbose = flags.verbose;
    this.timeout = flags.timeout;
    this.failFast = flags['fail-fast'];
    this.serial = flags.serial;

    this.project = new Project({
      environment: 'test',
      printSlowTrees: flags['print-slow-trees'],
      audit: !flags['skip-audit'],
      lint: !flags['skip-lint']
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
      this.project.build()
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
    let args = [ this.files, '!test/dummy/**/*' ];
    if (this.match) {
      args.push('--match', this.match);
    }
    if (this.debug) {
      ui.warn('Debugging support for tests is blocked on the release of ava 0.17');
      // args.unshift('--inspect', '--debug-brk');
    }
    if (this.verbose) {
      args.unshift('--verbose');
    }
    if (this.timeout) {
      args.unshift('--timeout', this.timeout);
    }
    if (this.failFast) {
      args.unshift('--fail-fast');
    }
    if (this.serial) {
      args.unshift('--serial');
    }
    this.tests = spawn('../node_modules/.bin/ava', args, {
      cwd: this.output,
      stdio: [ 'pipe', process.stdout, process.stderr ],
      env: assign({}, process.env, {
        PORT: this.port,
        DENALI_ENV: this.project.environment,
        NODE_ENV: this.project.environment,
        DEBUG_COLORS: 1
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
        process.exit(code);
      }
    });
  }

}
