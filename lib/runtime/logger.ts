import {
  identity,
  padStart
} from 'lodash';
import chalk from 'chalk';
import DenaliObject from '../metal/object';

export type LogLevel = 'info' | 'warn' | 'error';

/**
 * A simple Logger class that adds timestamps and supports multiple levels of
 * logging, colorized output, and control over verbosity.
 *
 * @package runtime
 * @since 0.1.0
 */
export default class Logger extends DenaliObject {

  /**
   * Default log level if none specified.
   *
   * @since 0.1.0
   */
  loglevel: LogLevel = 'info';

  /**
   * Specify if logs should be colorized.
   *
   * @since 0.1.0
   */
  colorize = true;

  /**
   * Specify if logs should be colorized.
   *
   * @since 0.1.3
   */
  timestamps = true;

  /**
   * Available log levels that can be used.
   */
  levels: LogLevel[] = [
    'info',
    'warn',
    'error'
  ];

  /**
   * Color map for the available levels.
   */
  colors: { [level: string]: (...text: string[]) => string } = {
    info: chalk.white,
    warn: chalk.yellow,
    error: chalk.red
  };

  /**
   * Log at the 'info' level.
   *
   * @since 0.1.0
   */
  info(msg: any): void {
    this.log('info', msg);
  }

  /**
   * Log at the 'warn' level.
   *
   * @since 0.1.0
   */
  warn(msg: any): void {
    this.log('warn', msg);
  }

  /**
   * Log at the 'error' level.
   *
   * @since 0.1.0
   */
  error(msg: any): void {
    this.log('error', msg);
  }

  /**
   * Log a message to the logger at a specific log level.
   */
  log(level: LogLevel, msg: string): void {
    if (this.levels.indexOf(level) === -1) {
      level = this.loglevel;
    }
    let padLength = this.levels.reduce((n: number, label) => Math.max(n, label.length), null);
    let levelLabel = padStart(level.toUpperCase(), padLength);
    if (this.colorize) {
      let colorizer = this.colors[level] || identity;
      msg = colorizer(msg);
      levelLabel = colorizer(levelLabel);
    }
    let parts: string[] = [];
    if (this.timestamps) {
      parts.push(`[${ (new Date()).toISOString() }]`);
    }
    parts.push(levelLabel);
    parts.push(msg);
    /* tslint:disable:no-console no-debugger */
    console.log(parts.join(' '));
    if (level === 'error') {
      debugger;
    }
    /* tslint:enable:no-console no-debugger*/
  }

}
