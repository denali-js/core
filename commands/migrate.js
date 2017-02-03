import assert from 'assert';
import path from 'path';
import dedent from 'dedent-js';
import Command from '../lib/cli/command';
import Project from '../lib/cli/project';
import spinner from '../lib/utils/spinner';
import tryRequire from '../lib/utils/try-require';
import commandExistsCallback from 'command-exists';
import Promise from 'bluebird';
import { exec } from 'child_process';
const run = Promise.promisify(exec);

const commandExists = Promise.promisify(commandExistsCallback);

export default class MigrateCommand extends Command {

  static commandName = 'migrate';
  static description = 'Run migrations to update your database schema';
  static longDescription = dedent`
    Runs (or rolls back) schema migrations for your database. Typically only
    applies when use SQL-based databases.`;

  flags = {
    rollback: {
      description: 'Rollback the latest migration, or latest --step migrations. Defaults to 1 step.',
      defaultValue: false,
      type: Boolean
    },
    redo: {
      description: 'Shortcut for rolling back then migrating up again. If used with --step, it will replay that many migrations. If used with --version, it will roll back to that version then replay. If neither, defaults to --step 1',
      defaultValue: false,
      type: Boolean
    },
    environment: {
      description: 'The environment configuration to use for connecting to the database',
      defaultValue: 'development',
      type: String
    }
  };

  runsInApp = true;

  allowExtraArgs = false;

  async run({ flags }) {
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
      environment: flags.environment,
      printSlowTrees: flags['print-slow-trees'],
      buildDummy: true
    });
    let application = await project.createApplication();
    assert(application.config.migrations && application.config.migrations.db, 'DB connection info is missing. You must supply the knex connection info in config.migrations.db.');
    let db = knex(application.config.migrations.db);
    let migrationsDir = path.join(application.dir, 'config', 'migrations');
    try {
      if (flags.rollback) {
        spinner.start('Rolling back last migration');
        await db.migrate.rollback({ directory: migrationsDir });
      } else if (flags.redo) {
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
