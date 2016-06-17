import path from 'path';
import Promise from 'bluebird';
import { exec as execCallback, spawn } from 'child_process';
import sane from 'sane';
import nsp from 'nsp';
import ui from '../lib/ui';
import Command from '../lib/command';
import BuildCommand from './build';
import assign from 'lodash/assign';

const exec = Promise.promisify(execCallback);

export default class ServerCommand extends Command {

  static commandName = 'server';
  static description = 'Runs the denali server for local or production use.';
  static longDescription = `
Launches the Denali server running your application.

In a development environment, the server does several things:

 * watches your local filesystem for changes and automatically restarts for
   you.
 * comes bundled with node-inspector under the --debug flag to easily start a
   debugging environment
 * lint your code on startup
 * run a security audit of your package.json on startup (via nsp)
 * run a MailDev server to capture outgoing emails sent by your app

In production, the above features are disabled by default, and instead:

 * the server will fork worker processes to maximize CPU core usage
  `;

  params = [];

  flags = {
    environment: {
      description: 'The environment to run as, i.e. `production` (defaults to $DENALI_ENV, $NODE_ENV, or development)',
      defaultValue: process.env.DENALI_ENV || process.env.NODE_ENV || 'development',
      type: String
    },
    debug: {
      description: 'Run in debug mode (add the --debug flag to node, launch node-inspector)',
      defaultValue: false,
      type: Boolean
    },
    watch: {
      description: 'Restart the server when the source files change (default: true in development)',
      defaultValue: null,
      type: Boolean
    },
    port: {
      description: 'The port the HTTP server should bind to (default: 3000)',
      defaultValue: 3000,
      type: Number
    },
    lint: {
      description: 'Lint the app source files (default: true in development)',
      defaultValue: null,
      type: Boolean
    },
    mail: {
      description: 'Start MailDev to capture development emails for debugging (default: false)',
      defaultValue: false,
      type: Boolean
    },
    skipAudit: {
      description: 'Skip auditing your package.json for vulnerabilites (default: false)',
      defaultValue: false,
      type: Boolean
    }
  };

  runsInApp = true;

  run({ flags }) {
    if (flags.watch == null) {
      flags.watch = flags.environment === 'development';
    }
    if (flags.lint == null) {
      flags.lint = flags.environment !== 'production';
    }

    this.environment = assign({}, process.env);
    if (flags.port) {
      this.environment.PORT = flags.port;
    }
    if (flags.environment) {
      this.environment.DENALI_ENV = flags.environment;
      this.environment.NODE_ENV = flags.environment;
    }

    if (flags.debug) {
      this.debug = true;
    }

    if (flags.mail) {
      this.startMailDev();
    }

    if (!flags.skipAudit) {
      this.auditPackages();
    }

    if (flags.lint) {
      this.lint = true;
    }

    if (flags.watch) {
      this.startWatching();
    } else {
      this.startServer();
    }
  }

  startMailDev() {
    let maildevPath = path.join('node_modules', '.bin', 'maildev');
    spawn(maildevPath);
    ui.debug('Starting MailDev server, visit http://localhost:1080 to view sent emails');
  }

  startWatching() {
    this.watcher = sane('.', { glob: [ 'app/**/*.js', 'config/**/*.js' ] });
    this.watcher.on('ready', () => {
      this.startServer().then(() => {
        this.server.on('exit', (code) => {
          let result = code === 0 ? 'exited' : 'crashed';
          ui.error(`Server ${ result }. waiting for changes to restart ...`);
        });
      });
    });
    this.watcher.on('change', this.restartServer.bind(this));
    this.watcher.on('add', this.restartServer.bind(this));
    this.watcher.on('delete', this.restartServer.bind(this));
  }

  startServer() {
    return Promise.resolve().then(() => {
      if (this.lint) {
        return new Promise((resolve, reject) => {
          exec('./node_modules/.bin/eslint app/**/*.js config/**/*.js', (err, stdout, stderr) => {
            if (err) {
              ui.warn('Linting failed:');
              ui.raw('warn', stdout);
              ui.raw('warn', stderr);
              return reject(err);
            }
            ui.raw('info', stdout);
            resolve();
          });
        });
      }
    }).finally(() => {
      return BuildCommand.prototype.build.call(this);
    }).then(() => {
      let args = [ 'index.js' ];
      if (this.debug) {
        args.unshift('--inspect=9229 --debug-brk');
      }
      this.server = spawn('node', args, {
        stdio: [ 'pipe', process.stdout, process.stderr ],
        env: this.environment
      });
    });
  }

  restartServer() {
    if (this.server) {
      this.server.removeAllListeners('exit');
      this.server.kill();
    }
    this.startServer();
  }

  auditPackages() {
    nsp.check({ package: path.resolve('package.json') }, (err, results) => {
      if (err && [ 'ENOTFOUND', 'ECONNRESET' ].includes(err.code)) {
        ui.warn('Error trying to scan package dependencies for vulnerabilities with nsp, skipping scan ...');
        ui.warn(err);
      }
      if (results && results.length > 0) {
        ui.warn('WARNING: Some packages in your package.json may have security vulnerabilities:');
        results.map(ui.warn.bind(ui));
      }
    });
  }

}

