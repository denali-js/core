import assert from 'assert';
import path from 'path';
import dedent from 'dedent-js';
import Command from '../lib/cli/command';
import Project from '../lib/cli/project';
import spinner from '../lib/utils/spinner';
import knex from 'knex';

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
    }
  };

  runsInApp = true;

  allowExtraArgs = false;

  async run({ flags }) {
    let project = new Project({
      environment: flags.environment,
      printSlowTrees: flags['print-slow-trees'],
      buildDummy: true
    });
    let application = await project.createApplication();
    assert(application.config.migrations && application.config.migrations.db, 'DB connection info is missing. You must supply the knex connection info in config.migrations.db.');
    let db = knex(application.config.migrations.db);
    let migrationsDir = path.join(project.dir, 'config', 'migrations');
    if (flags.rollback) {
      spinner.start('Rolling back last migration');
      await db.migrate.rollback({ directory: migrationsDir });
      spinner.succeed('Migrations complete');
    } else if (flags.redo) {
      spinner.start('Rolling back and replaying last migration');
      await db.migrate.rollback({ directory: migrationsDir });
      await db.migrate.latest({ directory: migrationsDir });
      spinner.succeed('Migrations complete');
    } else {
      spinner.start('Running migrations to latest');
      await db.migrate.latest({ directory: migrationsDir });
      spinner.succeed('Migrations complete');

    }
    await db.destroy();
  }

}
