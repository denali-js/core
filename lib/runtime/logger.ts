import * as chalk from 'chalk';
import {
  identity,
  padStart
} from 'lodash';
import DenaliObject from '../metal/object';

type LogLevel = 'info' | 'warn' | 'error';

interface ColorsMap {
  [level: string]: chalk.ChalkChain;
}

/**
 * A simple Logger class that adds timestamps and supports multiple levels of
 * logging, colorized output, and control over verbosity.
 *
 * @export
 * @class Logger
 * @extends {DenaliObject}
 * @module denali
 * @submodule runtime
 */
export default class Logger extends DenaliObject {

  /**
   * Default log level if none specified.
   *
   * @type {LogLevel}
   */
  public loglevel: LogLevel;

  /**
   * Specify if logs should be colorized.
   *
   * @type {boolean}
   */
  public colorize: boolean = true;

  /**
   * Available log levels that can be used.
   *
   * @type {LogLevel[]}
   */
  public levels: LogLevel[] = [
    'info',
    'warn',
    'error'
  ];

  /**
   * Color map for the available levels.
   *
   * @type {ColorsMap}
   */
  public colors: ColorsMap = {
    info: chalk.white,
    warn: chalk.yellow,
    error: chalk.red
  };

  /**
   * Log at the 'info' level.
   *
   * @param {*} msg
   */
  public info(msg: any): void {
    this.log('info', msg);
  }

  /**
   * Log at the 'warn' level.
   *
   * @param {*} msg
   */
  public warn(msg: any): void {
    this.log('warn', msg);
  }

  /**
   * Log at the 'error' level.
   *
   * @param {*} msg
   */
  public error(msg: any): void {
    this.log('error', msg);
  }

  /**
   * Log a message to the logger at a specific log level.
   *
   * @param {LogLevel} level
   * @param {*} msg
   */
  public log(level: LogLevel, msg: any): void {
    if (arguments.length !== 1) {
      msg = level;
      level = this.loglevel;
    }
    if (this.levels.indexOf(level) === -1) {
      level = this.loglevel;
    }
    let timestamp = (new Date()).toISOString();
    let padLength = this.levels.reduce((n: number, label) => Math.max(n, label.length), null);
    let levelLabel = padStart(level.toUpperCase(), padLength);
    if (this.colorize) {
      let colorizer = this.colors[level] || identity;
      msg = colorizer(msg);
      levelLabel = colorizer(levelLabel);
    }
    /* eslint-disable no-console */
    console.log(`[${ timestamp }] ${ levelLabel } - ${ msg }`);
    /* eslint-enable no-console */
  }

}
