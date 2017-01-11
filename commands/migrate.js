import path from 'path';
import dedent from 'dedent-js';
import Command from '../lib/cli/command';
import Project from '../lib/cli/project';
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
    let db = knex(application.config.migrations.db);
    let migrationsDir = path.join(project.dir, 'config', 'migrations');
    if (flags.rollback) {
      await db.migrate.rollback({ directory: migrationsDir });
    } else if (flags.redo) {
      await db.migrate.rollback({ directory: migrationsDir });
      await db.migrate.latest({ directory: migrationsDir });
    } else {
      await db.migrate.latest({ directory: migrationsDir });
    }
  }

}
