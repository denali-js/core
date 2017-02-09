import path from 'path';
import dedent from 'dedent-js';
import { spawn, ChildProcess } from 'child_process';
import ui from '../lib/cli/ui';
import Command, { CommandOptions, CommandFlags } from '../lib/cli/command';
import Project from '../lib/cli/project';
import {
  assign
} from 'lodash';

export default class TestCommand extends Command {

  static commandName = 'test';
  static description = "Run your app's test suite";
  static longDescription = dedent`
    Runs your app's test suite, and can optionally keep re-running it on each file
    change (--watch).`;

  runsInApp = true;

  params = [ 'files' ];

  flags: CommandFlags = {
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

  tests: ChildProcess;

  async run(options: CommandOptions) {
    let files = options.params.files || 'test/**/*.js';
    if (typeof files === 'string') {
      files = [ files ];
    }

    let project = new Project({
      environment: 'test',
      printSlowTrees: options.flags['print-slow-trees'],
      audit: !options.flags['skip-audit'],
      lint: !options.flags['skip-lint'],
      buildDummy: true
    });

    process.on('exit', this.cleanExit.bind(this));
    process.on('SIGINT', this.cleanExit.bind(this));
    process.on('SIGTERM', this.cleanExit.bind(this));

    if (options.flags.watch) {
      project.watch({
        outputDir: options.flags.output,
        // Don't let broccoli rebuild while tests are still running, or else
        // we'll be removing the test files while in progress leading to cryptic
        // errors.
        beforeRebuild: () => {
          if (this.tests) {
            return new Promise<void>((resolve) => {
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
        onBuild: this.runTests.bind(this, files, project, options)
      });
    } else {
      try {
        await project.build(options.flags.output)
        this.runTests(files, project, options);
      } catch (error) {
        process.exitCode = 1;
      }
    }
  }

  cleanExit() {
    if (this.tests) {
      this.tests.kill();
    }
  }

  runTests(files: string[], project: Project, options: CommandOptions) {
    let avaPath = path.join(process.cwd(), 'node_modules', '.bin', 'ava');
    let args = files.concat([ '!test/dummy/**/*', '--concurrency', options.flags.concurrency ]);
    if (options.flags.debug) {
      avaPath = process.execPath;
      args = [ '--inspect', '--debug-brk', path.join(process.cwd(), 'node_modules', 'ava', 'profile.js'), options.flags.debug ];
    }
    if (options.flags.match) {
      args.push('--match', options.flags.match);
    }
    if (options.flags.verbose) {
      args.unshift('--verbose');
    }
    if (options.flags.timeout) {
      args.unshift('--timeout', options.flags.timeout);
    }
    if (options.flags['fail-fast']) {
      args.unshift('--fail-fast');
    }
    if (options.flags.serial) {
      args.unshift('--serial');
    }
    this.tests = spawn(avaPath, args, {
      cwd: options.flags.output,
      stdio: [ 'pipe', process.stdout, process.stderr ],
      env: assign({}, process.env, {
        PORT: options.flags.port,
        DENALI_LEAVE_TMP: options.flags.litter,
        DENALI_ENV: project.environment,
        NODE_ENV: project.environment,
        DEBUG_COLORS: 1
      })
    });
    ui.info(`===> Running ${ project.pkg.name } tests ...`);
    this.tests.on('exit', (code) => {
      if (code === 0) {
        ui.success('\n===> Tests passed 👍');
      } else {
        ui.error('\n===> Tests failed 💥');
      }
      delete this.tests;
      if (options.flags.watch) {
        ui.info('===> Waiting for changes to re-run ...\n\n');
      } else {
        process.exitCode = code === null ? 1 : code;
        ui.info(`===> exiting with ${ process.exitCode }`);
      }
    });
  }

}
