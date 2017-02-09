import path from 'path';
import findup = require('findup-sync');
import ui from './ui';
import {
  forIn,
  padEnd,
  includes
} from 'lodash';
import DenaliObject from '../metal/object';

export interface CommandOptions {
  params: {
    [param: string]: string | string[];
  }
  flags: {
    [flag: string]: any;
  };
}

export interface CommandFlags {
  [flagName: string]: CommandFlag;
}

interface CommandFlag {
  description?: string;
  defaultValue?: any;
  type?: Function;
}

export interface AllCommands {
  [commandName: string]: typeof Command;
}

/**
 * Represents a subcommand of the `denali` CLI.
 *
 * @module denali
 * @submodule cli
 */
abstract class Command extends DenaliObject {

  static get commandName(): string {
    return this.name;
  }

  /**
   * Description of what the command does. Displayed when `denali` is run
   * without arguments.
   */
  static description: string = null;
  static longDescription: string = null;
  static hidden: boolean = false;

  /**
   * An array of positional paramters to this command. For example,
   *
   *     params: [ 'foo', 'bar' ]
   *
   * When run with:
   *
   *     $ denali mycommand Hello World
   *
   * Would result in:
   *
   *     run(params) {
   *       params.foo // "Hello"
   *       params.bar // "World"
   *     }
   */
  params: string[] = [];

  /**
   * Configuration for which flags the command accepts. Flags start with `-` or
   * `--`, and can be booleans (i.e. the flag is present or not), strings (i.e.
   * `--environment production`), or arrays of strings (i.e. `--files foo bar`).
   */
  flags: CommandFlags = {};

  /**
   * If true, Denali will require that this command be run inside an existing
   * app.
   */
  runsInApp: boolean = false;

  /**
   * If true, Denali will allow additional arguments to be supplied with the
   * command without printing a warning. This is useful particular for
   * blueprints, where the arguments may vary across blueprints.
   */
  allowExtraArgs: boolean = false;

  /**
   * Run the command.
   */
  abstract run(options: CommandOptions, argTokens: string[], commands: AllCommands): Promise<void>;

  async _run(argTokens: string[], commands: AllCommands): Promise<void> {
    if (includes(argTokens, '-h') || includes(argTokens, '--help')) {
      return this.printHelp(commands);
    }
    let projectDir = this.isDenaliApp();
    if (typeof projectDir === 'string') {
      if (this.runsInApp === false) {
        return ui.error('You are already inside a Denali app. This command can only be run *outside* an existing app');
      }
      process.chdir(projectDir);
    } else if (this.runsInApp === true) {
      return ui.error('This command can only be run inside a Denali app');
    }
    await this.run(this.parseArgs(argTokens), argTokens, commands);
  }

  isDenaliApp(): string | boolean {
    let pkgpath = findup('package.json');
    if (pkgpath) {
      const pkg = require(path.resolve(pkgpath));
      let isApp = pkg.dependencies && pkg.dependencies.denali;
      let isAddon = pkg.keywords && pkg.keywords.includes('denali-addon');
      let inTmp = path.relative(path.dirname(pkgpath), process.cwd()).startsWith('tmp');
      return (isApp || isAddon) && !inTmp ? path.resolve(path.dirname(pkgpath)) : false;
    }
    return false;
  }

  printHelp(commands: AllCommands): void {
    let CommandClass = <typeof Command>this.constructor;
    let paramsHelp = this.params.map((param) => `<${ param }>`).join(' ');
    ui.info(`usage: denali ${ CommandClass.commandName } ${ paramsHelp }\n`);
    ui.info(CommandClass.longDescription.trim());
    if (Object.keys(this.flags).length > 0) {
      ui.info('\nOptions:');
      let pad = Object.keys(this.flags).reduce((length, flag) => Math.max(length, flag.length), 0);
      forIn(this.flags, (config, name) => {
        ui.info(`  ${ padEnd(name, pad) }  ${ config.description }`);
      });
    }
    ui.info('');
  }

  parseArgs(argTokens: string[]): CommandOptions {
    // Parse the arguments - there are two types of args: flags (i.e. --flag) and
    // params (i.e. positional args)
    let args = argTokens.slice(0);
    let options: CommandOptions = {
      params: {},
      flags: {}
    };

    forIn(this.flags, (config, name) => {
      if (config.defaultValue) {
        options.flags[name] = config.defaultValue;
      }
    });

    let lastParamName = null;
    while (args.length > 0) {
      let arg = args.shift();

      // It's a flag if the first char is '-'
      if (arg.charAt(0) === '-') {
        arg = arg.match(/--?(.*)/)[1];

        // Find the matching flag - this allows for partial flag names, i.e.
        // --env will match --environment
        let flagName: string;
        let flagConfig: CommandFlag = {};
        forIn(this.flags, (config, name) => {
          if (name.startsWith(arg)) {
            flagName = name;
            flagConfig = config;
          }
        });

        // No preconfigured flag was found, so ...
        if (!flagConfig) {
          // Every command has --help/-h flag
          if ('help'.startsWith(arg)) {
            flagName = 'help';
            flagConfig = {};
          // Otherwise, warn the user that flag isn't supported
          } else {
            if (this.allowExtraArgs !== true) {
              ui.warn(`WARNING: ${ arg } is not a recognized option for the ${ (<typeof Command>this.constructor).commandName } command`);
            }
            continue;
          }
        }

        if (flagConfig.type === Boolean) {
          options.flags[flagName] = true;
        } else if (flagConfig.type === Number) {
          options.flags[flagName] = Number(args.shift());
        } else {
          options.flags[flagName] = args.shift();
        }

       // Must be a param. If positional params still available, use the next
      } else if (this.params.length > 0) {
        let paramName = this.params.shift();
        options.params[paramName] = arg;
        lastParamName = paramName;

      // Otherwise, if this command doesn't take any positional params at all,
      // warn the user.
      } else if (!lastParamName && !this.allowExtraArgs) {
        ui.warn(`The ${ (<typeof Command>this.constructor).commandName } command doesn't take any arguments.`);

      // If it does take positional params, but they've all been used up,
      // convert the last positional param to an array and add this arg to it.
      // This allows for variable param lengths.
      } else if (!Array.isArray(options.params[lastParamName])) {
        options.params[lastParamName] = <any>[ options.params[lastParamName], arg ];
      } else {
        (<string[]>options.params[lastParamName]).push(arg);
      }

    }

    return options;
  }

}

export default Command;