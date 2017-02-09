import fs from 'fs';
import path from 'path';
import ui from '../lib/cli/ui';
import {
  findKey
} from 'lodash';
import discoverAddons from '../lib/utils/discover-addons';
import createDebug from 'debug';
import Command, { AllCommands } from '../lib/cli/command';

const debug = createDebug('denali:commands:index');

export default function run(localDenaliPath: string)  {
  debug('discovering commands from addons');
  let commands: AllCommands = {};

  // Find addon commands
  if (localDenaliPath) {
    let addons = discoverAddons(process.cwd());
    addons.forEach((addonDir) => {
      let addonCommands = discoverCommands(path.join(addonDir, 'commands'));
      commands = Object.assign(commands, addonCommands);
    });
  }

  // Core commands take precedence
  commands = Object.assign(commands, discoverCommands(__dirname));

  // Process the command line arguments
  let argTokens = process.argv.slice(2);

  // If no subcommand was supplied, then treat that as the 'root' subcommand
  let suppliedCommand: string;
  if (argTokens.length === 0 || argTokens[0].startsWith('-')) {
    suppliedCommand = 'root';
  } else {
    suppliedCommand = argTokens.shift();
  }

  // Find the command that best matches the supplied subcommand
  let fullCommandName = findKey(commands, (command, commandName) => {
    return commandName.startsWith(suppliedCommand);
  });

  if (!fullCommandName) {
    ui.error(`${ suppliedCommand } is not a recognized command.`);
    process.exit(1);
  }

  // Instantiate the request subcommand
  let command: Command = new (<any>commands[fullCommandName])();

  // Invoke the command
  debug('running command');
  command._run(argTokens, commands).catch((err) => {
    ui.error(err.stack);
  });
}

function discoverCommands(dir: string) {
  if (!fs.existsSync(dir)) {
    return {};
  }
  return fs.readdirSync(dir).filter((filename) => {
    return fs.statSync(path.join(dir, filename)).isFile() && path.extname(filename) === '.js' && filename !== 'index.js';
  }).reduce((commands, filename) => {
    let Command = require(path.join(dir, filename)).default;
    commands[Command.commandName] = Command;
    return commands;
  }, <AllCommands>{});
}
