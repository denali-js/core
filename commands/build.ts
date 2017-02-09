import dedent from 'dedent-js';
import Command, { CommandOptions } from '../lib/cli/command';
import Project from '../lib/cli/project';

export default class BuildCommand extends Command {

  static commandName = 'build';
  static description = 'Compile your app into optimized ES5 code';
  static longDescription = dedent`
    Takes your app's ES201X source code and produces compiled, sourcemapped, and
    optimized output compatible with Node 6.`;

  params: string[] = [];

  flags = {
    environment: {
      description: 'The target environment to build for.',
      defaultValue: 'development',
      type: String
    },
    output: {
      description: 'The directory to build into',
      defaultValue: 'dist',
      type: String
    },
    watch: {
      description: 'Continuously watch the source files and rebuild on changes',
      defaultValue: false,
      type: Boolean
    },
    'print-slow-trees': {
      description: 'Print out an analysis of the build process, showing the slowest nodes.',
      defaultValue: false,
      type: Boolean
    }
  };

  runsInApp = true;

  async run(options: CommandOptions) {
    let project = new Project({
      environment: options.flags.environment,
      printSlowTrees: options.flags['print-slow-trees'],
      lint: options.flags.environment !== 'production'
    });

    if (options.flags.watch) {
      project.watch({
        outputDir: <string>options.flags.output
      });
    } else {
      await project.build(options.flags.output);
    }
  }

}
