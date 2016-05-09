import path from 'path';
import Promise from 'bluebird';
import spawn from 'child_process'.spawn;
import exec from .promisify(require('child_process').exec);
import sane from 'sane';
import nsp from 'nsp';
import ui from '../lib/ui';
import Command from '../lib/command';
import assign from 'lodash/assign';

export default class ServerCommand extends {

  description = 'Runs the denali server for local or production use.';

  params = [];

  flags = {
    environment: {
      description: 'The environment to run as, i.e. `production`',
      defaultValue: process.env.DENALI_ENV || process.env.NODE_ENV || 'development'
    },
    debug: {
      description: 'Run the server in debug mode (adds the --debug flag to node and launches node-inspector)',
      defaultValue: false
    },
    watch: {
      description: 'Restart the server when the source files change (enabled by default in development)',
      defaultValue: null
    },
    port: {
      description: 'The port the HTTP server should bind to',
      defaultValue: 3000
    },
    lint: {
      description: 'Lint the app source files',
      defaultValue: null
    },
    mail: {
      description: 'Start MailDev to capture development emails for debugging',
      defaultValue: null
    },
    skipAudit: {
      description: 'Skip auditing your package.json for vulnerabilites',
      defaultValue: false
    }
  };

  runsInApp = true;

  run(params, flags) {
    if (flags.watch == null) {
      flags.watch = flags.environment === 'development';
    }
    if (flags.lint == null) {
      flags.lint = flags.environment !== 'production';
    }
    if (flags.mail == null) {
      flags.mail = flags.environment === 'development';
    }

    this.environment = assign({}, process.env);
    this.environment.PORT = flags.port;
    this.environment.DENALI_ENV = flags.environment;
    this.environment.NODE_ENV = flags.environment;

    if (flags.debug) {
      this.debug = true;
      this.startNodeInspector();
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

  startNodeInspector() {
    let inspectorPath = path.join('node_modules', '.bin', 'node-inspector');
    spawn(inspectorPath, [ '--web-port', '4000', '--no-preload' ]);
    ui.debug('Starting in debug mode. You can access the debugger at http://localhost:4000/?port=5858');
  }

  startMailDev() {
    let maildevPath = path.join('node_modules', '.bin', 'maildev');
    spawn(maildevPath);
    ui.debug('Starting MailDev server, visit http://localhost:1080 to view sent emails');
  }

  startWatching() {
    this.watcher = sane('.', { glob: [ '**/*.js' ] });
    this.watcher.on('ready', () => {
      this.startServer();
      this.server.on('exit', (code) => {
        let result = code === 0 ? 'exited' : 'crashed';
        ui.error(`Server ${ result }. waiting for changes to restart ...`);
      });
    });
    this.watcher.on('change', this.restartServer.bind(this));
    this.watcher.on('add', this.restartServer.bind(this));
    this.watcher.on('delete', this.restartServer.bind(this));
  }

  startServer() {
    Promise.resolve().then(() => {
      if (this.lint) {
        return exec('./node_modules/.bin/eslint app/**/*.js config/**/*.js');
      }
    }).then(([ stdout ]) => {
      ui.raw('info', stdout);
      let args = [ 'index.js' ];
      if (this.debug) {
        args.unshift('--debug-brk');
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

