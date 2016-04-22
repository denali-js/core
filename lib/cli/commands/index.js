const fs = require('fs');
const ui = require('../lib/ui');
const withoutExt = require('../../utils/without-ext');
const without = require('lodash/without');
const forIn = require('lodash/forIn');

// Load the available commands
let commands = fs.readdirSync(__dirname);
commands = commands.map((filename) => withoutExt(filename));
commands = without(commands, [ 'default', 'index' ]);

// Load the command
let args = process.argv.slice(0);
args.shift(); // drop the 'denali' command

let suppliedCommand;
if (args[0].startsWith('-')) {
  suppliedCommand = 'default';
} else {
  suppliedCommand = args.shift();
}

let fullCommandName = commands.find((command) => {
  return command.startsWith(suppliedCommand);
});

if (!fullCommandName) {
  ui.error(`'${ suppliedCommand } is not a recognized command.`);
  process.exit(1);
}

const Command = require(`./${ fullCommandName }`);
let command = new Command();

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
command.run(params, flags);
