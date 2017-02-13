import {
  assign
} from 'lodash';
import * as fs from 'fs-extra';
import * as path from 'path';
import unwrap from '../lib/utils/unwrap';
import { spawn, ChildProcess } from 'child_process';
import { ui, Command, Project } from 'denali-cli';
import * as createDebug from 'debug';

const debug = createDebug('denali:commands:server');

export default class ServerCommand extends Command {

  static commandName = 'server';
  static description = 'Runs the denali server for local or production use.';
  static longDescription = unwrap`
    Launches the Denali server running your application.

    In a development environment, the server does several things:

     * watches your local filesystem for changes and automatically restarts for you.
     * lint your code on build
     * run a security audit of your package.json on build (via nsp)

    In production, the above features are disabled by default, and instead:

     * the server will fork worker processes to maximize CPU core usage`;

  static runsInApp = true;

  static flags = {
    debug: {
      description: 'Run in debug mode (add the --debug flag to node, launch node-inspector)',
      defaultValue: false,
      type: <any>'boolean'
    },
    watch: {
      description: 'Restart the server when the source files change (default: true in development)',
      type: <any>'boolean'
    },
    port: {
      description: 'The port the HTTP server should bind to (default: 3000)',
      defaultValue: 3000,
      type: <any>'number'
    },
    lint: {
      description: 'Lint the app source files (default: true in development)',
      type: <any>'boolean'
    },
    audit: {
      description: 'Auditing your package.json for vulnerabilites (default: true in development)',
      type: <any>'boolean'
    },
    output: {
      description: 'The directory to write the compiled app to. Defaults to a tmp directory',
      defaultValue: 'dist',
      type: <any>'string'
    },
    production: {
      description: 'Start the server in production mode: skip the build (assumes the app was prebuilt), skips nsp audits, runs with DENALI_ENV=production',
      defaultValue: false,
      type: <any>'boolean'
    },
    printSlowTrees: {
      description: 'Print out an analysis of the build process, showing the slowest nodes.',
      defaultValue: false,
      type: <any>'boolean'
    }
  }

  server: ChildProcess;

  async run(argv: any) {
    debug('running server command');
    let environment = argv.environment = argv.production ? 'production' : process.env.DENALI_ENV || process.env.NODE_ENV || 'development';
    argv.watch = argv.watch || environment === 'development';

    if (environment === 'production') {
      return this.startServer(argv);
    }

    let project = new Project({
      environment,
      printSlowTrees: argv.printSlowTrees,
      audit: argv.audit || environment === 'development',
      lint: argv.lint ||environment !== 'production',
      buildDummy: true
    });

    process.on('exit', this.cleanExit.bind(this));
    process.on('SIGINT', this.cleanExit.bind(this));
    process.on('SIGTERM', this.cleanExit.bind(this));

    if (argv.watch || environment === 'development') {
      debug('starting watcher');
      project.watch({
        outputDir: argv.output,
        onBuild: () => {
          if (this.server) {
            debug('killing existing server');
            this.server.removeAllListeners('exit');
            this.server.kill();
          }
          this.startServer(argv);
        }
      });
    } else {
      debug('building project');
      await project.build(argv.output);
      this.startServer(argv);
    }
  }

  cleanExit() {
    if (this.server) {
      this.server.kill();
    }
  }

  startServer(argv: any) {
    let dir = argv.output;
    let args = [ 'app/index.js' ];
    let defaultEnvs = {
      PORT: argv.port,
      DENALI_ENV: argv.environment,
      NODE_ENV: argv.environment
    };
    if (argv.debug) {
      args.unshift('--inspect', '--debug-brk');
    }
    if (!fs.existsSync(path.join(dir, 'app', 'index.js'))) {
      ui.error('Unable to start your application: missing app/index.js file');
      return;
    }
    debug(`starting server process: ${ process.execPath } ${ args.join(' ') }`);
    this.server = spawn(process.execPath, args, {
      cwd: dir,
      stdio: [ 'pipe', process.stdout, process.stderr ],
      env: assign({}, defaultEnvs, process.env)
    });
    this.server.on('error', (error) => {
      ui.error('Unable to start your application:');
      ui.error(error.stack);
    });
    if (argv.watch) {
      this.server.on('exit', (code) => {
        let result = code === 0 ? 'exited' : 'crashed';
        ui.error(`Server ${ result }. waiting for changes to restart ...`);
      });
    }
  }

}
