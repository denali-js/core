import path from 'path';
import resolve from 'resolve';
import findup from 'findup-sync';
import ui from '../lib/ui';
import tryRequire from '../../utils/try-require';
import topsort from '../../utils/topsort';
import assign from 'lodash/assign';
import findKey from 'lodash/findKey';
import forIn from 'lodash/forIn';

import AddonCommand from './addon';
import ConsoleCommand from './console';
import RootCommand from './root';
import DestroyCommand from './destroy';
import GenerateCommand from './generate';
import InstallCommand from './install';
import NewCommand from './new';
import ServerCommand from './server';
import TestCommand from './test';

let projectPkgPath = findup('package.json');
let isDenaliPkg = false;
let projectPkg;
if (projectPkgPath) {
  projectPkg = require(path.resolve(projectPkgPath));
  isDenaliPkg = projectPkg.keywords && (projectPkg.keywords.includes('denali-addon') || projectPkg.dependencies.denali);
}

let commands = {};

if (isDenaliPkg) {
  // Load the available addon commands by recusring through the dependency graph
  // and loading the 'commands.js' file for each addon
  let addons = [];
  function discoverAddons(pkgDir) {
    let pkg = require(path.join(pkgDir, 'package.json'));
    forIn(pkg.dependencies, (version, pkgName) => {
      let depMainPath = resolve.sync(pkgName, { basedir: pkgDir });
      let depDir = findup(depMainPath, 'package.json');
      let depPkgPath = path.join(depDir, 'package.json');

      let depPkg = require(depPkgPath);
      let isDenaliAddon = depPkg.keywords && depPkg.keywords.includes('denali-addon');

      if (isDenaliAddon) {
        let loadOptions = depPkg.denali || {};

        let addonCommands = tryRequire(path.join(depDir, 'commands'));
        // Tack on the addon each command came from
        forIn(addonCommands, (command) => {
          command._addon = depPkg;
        });
        addons.push({
          name: depPkg.name,
          value: addonCommands,
          before: loadOptions.before,
          after: loadOptions.after
        });
        discoverAddons(depDir);
      }
    });
  }
  discoverAddons(process.cwd());
  addons = topsort(addons, { valueKey: 'value' });

  // Merge the depedency graph so that later addons take precedence over earlier
  // ones in case of conflicting command names
  commands = addons.reduce((mergedCommands, addonCommands) => {
    return assign(mergedCommands, addonCommands);
  }, {});
}

// Assemble the core commands supplied by denali itself
let coreCommands = {
  addon: AddonCommand,
  console: ConsoleCommand,
  root: RootCommand,
  destroy: DestroyCommand,
  generate: GenerateCommand,
  install: InstallCommand,
  new: NewCommand,
  server: ServerCommand,
  test: TestCommand
};

// Core commands take absolute precdence over all others
commands = assign(commands, coreCommands);

// Process the command line arguments
let args = process.argv.slice(2);

// If no subcommand was supplied, then treat that as the 'root' subcommand
let suppliedCommand;
if (args.length === 0 || args[0].startsWith('-')) {
  suppliedCommand = 'root';
} else {
  suppliedCommand = args.shift();
}

// Fspawnind the command that best matches the supplied subcommand
let fullCommandName = findKey(commands, (command, commandName) => {
  return commandName.startsWith(suppliedCommand);
});

if (!fullCommandName) {
  ui.error(`${ suppliedCommand } is not a recognized command.`);
  process.exit(1);
}

// Instantiate the request subcommand
let command = new commands[fullCommandName]();

// Parse the arguments
let params = {};
let flags = {};
let lastParamName = null;
while (args.length > 0) {
  let arg = args.shift();

  // It's a flag
  if (arg.charAt(0) === '-') {
    arg = arg.match(/--?(.w)/)[1];
    // Find the matching flag
    let flagConfig;
    let flagName;
    forIn(command.flags, (config, name) => {
      if (name.startsWith(arg)) {
        flagName = name;
        flagConfig = config;
      }
    });
    if (!flagConfig) {
      ui.warn(`WARNING: ${ arg } is not a recognized option for the ${ fullCommandName } command`);
      continue;
    }

    if (flagConfig.type === Boolean) {
      flags[flagName] = true;
    } else if (flagConfig.type === String) {
      flags[flagName] = args.shift();
    } else if (flagConfig.type === Array) {
      // It's an array of values, so soak up args until the next flag or end
      flags[flagName] = [];
      while (args.length > 0) {
        if (args[0].charAt(0) !== '-') {
          flags[flagName].push(args.shift());
        }
      }
    }

  // It's a param
  } else {

    // If there's still positional params available, use the next one
    if (command.params.length > 0) {
      let paramName = command.params.shift();
      params[paramName] = arg;
      lastParamName = paramName;
    } else {

      // Otherwise, if this command doesn't take any positional params at all,
      // warn the user.
      if (!lastParamName) {
        ui.warn(`The ${ fullCommandName } command doesn't take any arguments.`);

      // If it does take positional params, but they've all been used up,
      // convert the last positional param to an array and add this arg to it.
      // This allows for variable param lengths.
      } else {
        if (!Array.isArray) {
          params[lastParamName] = [ params[lastParamName], arg ];
        } else {
          params[lastParamName].push(arg);
        }
      }

    }

  }
}

// Invoke the command
command.run(params, flags, commands);
