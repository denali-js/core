import * as assert from 'assert';
import * as path from 'path';
import unwrap from '../lib/utils/unwrap';
import { ui, spinner, Command, Project } from 'denali-cli';
import tryRequire from 'try-require';
import * as cmdExists from 'command-exists';
import * as Bluebird from 'bluebird';
import { exec, ExecOptions } from 'child_process';

const run = Bluebird.promisify<[ string, string ], string>(exec);
const commandExists = Bluebird.promisify<boolean, string>(cmdExists);

export default class MigrateCommand extends Command {

  static commandName = 'migrate';
  static description = 'Run migrations to update your database schema';
  static longDescription = unwrap`
    Runs (or rolls back) schema migrations for your database. Typically only
    applies when use SQL-based databases.`;

  static flags = {
    rollback: {
      description: 'Rollback the latest migration, or latest --step migrations. Defaults to 1 step.',
      defaultValue: false,
      type: <any>'boolean'
    },
    redo: {
      description: 'Shortcut for rolling back then migrating up again. If used with --step, it will replay that many migrations. If used with --version, it will roll back to that version then replay. If neither, defaults to --step 1',
      defaultValue: false,
      type: <any>'boolean'
    },
    environment: {
      description: 'The environment configuration to use for connecting to the database',
      defaultValue: 'development',
      type: <any>'boolean'
    }
  };

  static runsInApp = true;

  async run(argv: any) {
    let knex = tryRequire('knex');
    if (!knex) {
      spinner.start('Installing knex (required for migrations)');
      let yarnExists = await commandExists('yarn');
      if (yarnExists) {
        await run('yarn add knex');
      } else {
        await run('npm install --save knex');
      }
      knex = require('knex');
      spinner.succeed('Knex installed');
    }
    let project = new Project({
      environment: argv.environment,
      buildDummy: true
    });
    let application = await project.createApplication();
    assert(application.config.migrations && application.config.migrations.db, 'DB connection info is missing. You must supply the knex connection info in config.migrations.db.');
    let db = knex(application.config.migrations.db);
    let migrationsDir = path.join(application.dir, 'config', 'migrations');
    try {
      if (argv.rollback) {
        spinner.start('Rolling back last migration');
        await db.migrate.rollback({ directory: migrationsDir });
      } else if (argv.redo) {
        spinner.start('Rolling back and replaying last migration');
        await db.migrate.rollback({ directory: migrationsDir });
        await db.migrate.latest({ directory: migrationsDir });
      } else {
        spinner.start('Running migrations to latest');
        await db.migrate.latest({ directory: migrationsDir });
      }
      let newVersion = await db.migrate.currentVersion();
      spinner.succeed(`Migrated to ${ newVersion }`);
    } catch (error) {
      spinner.fail(`Migrations failed:\n${ error.stack }`);
    } finally {
      await db.destroy();
    }
  }

}
