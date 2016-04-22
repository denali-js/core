/**
 * @module denali
 * @submodule cli
 */
const findup = require('findup');
const ui = require('./ui');
const DenaliObject = require('../../runtime/object');

/**
 * Represents a subcommand of the `denali` CLI.
 *
 * @class Command
 * @constructor
 * @private
 */
module.exports = DenaliObject.extend({

  /**
   * Description of what the command does. Displayed when `denali` is run
   * without arguments.
   *
   * @property description
   * @type String
   */
  description: null,

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
   *
   * @property params
   * @type Array
   */
  params: null,

  /**
   * Configuration for which flags the command accepts. Flags start with `-` or
   * `--`, and can be booleans (i.e. the flag is present or not), strings (i.e.
   * `--environment production`), or arrays of strings (i.e. `--files foo bar`).
   *
   * @property flags
   * @type {Object}
   * @example
   *     // i.e. $ denali mycommand --environment production --debug
   *     flags: {
   *       environment: {
   *         description: 'The environment to run under',
   *         defaultValue: 'development',
   *         type: 'string'
   *       },
   *       debug: {
   *         description: 'Start in debug mode',
   *         defaultValue: false,
   *         type: 'boolean'
   *       }
   *     }
   */
  flags: null,

  /**
   * Run the command.
   *
   * @method run
   * @param params {Object} an object containing the values of any configured
   * positional params
   * @param flags {Object} an object containing the values of any configured
   * flags
   */
  run() {
    throw new Error('You must implement a `run()` method');
  },

  _run() {
    if (this.runsInApp) {
      if (this.isDenaliApp()) {
        this.run();
      } else {
        ui.error('This command can only be run inside a Denali app');
      }
    }
  },

  isDenaliApp() {
    const pkgpath = findup('package.json');
    if (pkgpath) {
      const pkg = require(pkgpath);
      return pkg.dependencies && pkg.dependencies.denali;
    }
    return false;
  }

});
