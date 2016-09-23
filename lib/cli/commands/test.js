import path from 'path';
import { spawn, execSync } from 'child_process';
import sane from 'sane';
import nsp from 'nsp';
import ui from '../lib/ui';
import Command from '../lib/command';
import BuildCommand from './build';
import assign from 'lodash/assign';

export default class TestCommand extends Command {

  static commandName = 'test';
  static description = "Run your app's test suite";
  static longDescription = `
Runs your app's test suite, and can optionally keep re-running it on each file
change (--watch).
  `;

  params = [ 'files' ];

  flags = {
    environment: {
      description: 'The environment to run as, i.e. `production`; defaults to `test`',
      defaultValue: process.env.DENALI_ENV || process.env.NODE_ENV || 'test',
      type: String
    },
    debug: {
      description: 'Run the server in debug mode',
      defaultValue: false,
      type: Boolean
    },
    watch: {
      description: 'Re-run the tests when the source files change',
      defaultValue: null,
      type: Boolean
    },
    grep: {
      description: 'Filter which tests run based on the supplied regex pattern',
      defaultValue: null,
      type: String
    },
    lint: {
      description: 'Lint the app source files',
      defaultValue: null,
      type: Boolean
    },
    skipAudit: {
      description: 'Skip auditing your package.json for vulnerabilites',
      defaultValue: false,
      type: Boolean
    }
  };

  runsInApp = true;

  run({ params, flags }) {
    if (flags.lint == null) {
      flags.lint = flags.environment !== 'production';
    }

    this.environment = assign({}, process.env);
    this.environment.PORT = flags.port;
    this.environment.DENALI_ENV = flags.environment;
    this.environment.NODE_ENV = flags.environment;

    this.files = [ 'test/{integration,unit}/*.js' ].concat(params.files || []);

    if (flags.debug) {
      this.debug = true;
    }

    if (flags.grep) {
      this.grep = flags.grep;
    }

    if (flags.skipAudit) {
      this.auditPackages();
    }

    if (flags.lint) {
      this.lint = true;
    }

    if (flags.watch) {
      this.startWatching();
    } else {
      this.runTests();
    }
  }

  startWatching() {
    this.watcher = sane('.', { glob: [ 'app/**/*.js', 'config/**/*.js', 'test/**/*.js' ] });
    this.watcher.on('ready', () => {
      this.runTests().then(() => {
        this.tests.on('exit', (code) => {
          if (code === 0) {
            ui.success('Tests passed! (๑˃̵ᴗ˂̵)و');
          } else {
            ui.error('Tests failed! (▰˘︹˘▰)');
          }
          ui.info('Waiting for changes to re-run ...');
        });
      });
    });
    this.watcher.on('change', this.restartServer.bind(this));
    this.watcher.on('add', this.restartServer.bind(this));
    this.watcher.on('delete', this.restartServer.bind(this));
  }

  runTests() {
    return BuildCommand.prototype.build([ 'app', 'config', 'test' ]).then(() => {
      let args = this.files;
      if (this.lint) {
        try {
          execSync(`./node_modules/.bin/eslint ${ this.files || 'app/**/*.js config/**/*.js test/**/*.js' }`);
        } catch (e) {
          ui.error(e.stdout.toString());
        }
      }
      args = args.concat([ '--colors' ]);
      if (this.grep) {
        args = args.concat([ '--grep', this.grep ]);
      }
      let command = './node_modules/.bin/mocha';
      if (this.debug) {
        // Mocha has added, but not released, support for the `--inspect` flag.
        // So until that is released, we need to manually invoke mocha with the
        // node flag ourself.
        //
        // See: https://github.com/mochajs/mocha/pull/2357
        command = process.execPath;
        args = [ '--inspect', '--debug-brk', './node_modules/.bin/_mocha', '--', this.files ];
      }
      this.tests = spawn(command, args, {
        cwd: path.join(process.cwd(), 'dist'),
        stdio: [ 'pipe', process.stdout, process.stderr ],
        env: this.environment
      });
    });
  }

  restartServer() {
    ui.info('Change detected, re-running tests ...');
    if (this.tests) {
      this.tests.removeAllListeners('exit');
      this.tests.kill('SIGINT');
    }
    this.runTests();
  }

  auditPackages() {
    nsp.check({ package: path.resolve('package.json') }, (err, results) => {
      if (err && [ 'ENOTFOUND', 'ECONNRESET' ].includes(err.code)) {
        ui.warn('Error trying to scan package dependencies for vulnerabilities with nsp, skipping scan ...');
        ui.warn(err);
      }
      if (results && results.length > 0) {
        ui.warn('WARNING: Some packages in your package.json may have security vulnerabilities:');
        results.forEach((item) => {
          ui.warn(`${ item.module }: ${ item.recommendation }`);
        });
      }
    });
  }

}
