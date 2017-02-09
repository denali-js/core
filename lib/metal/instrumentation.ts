import EventEmitter from 'events';
import { merge } from 'lodash';

/**
 * The Instrumentation class is a low level class for instrumenting your app's
 * code. It allows you to listen to framework level profiling events, as well
 * as creating and firing your own such events.
 *
 * For example, if you wanted to instrument how long a particular action was taking:
 *
 *     import { Instrumentation, Action } from 'denali';
 *     export default class MyAction extends Action {
 *       respond() {
 *         let Post = this.modelFor('post');
 *         return Instrumentation.instrument('post lookup', { currentUser: this.user.id }, () => {
 *           Post.find({ user: this.user });
 *         });
 *       }
 *     }
 *
 * @export
 * @static
 * @class Instrumentation
 * @module denali
 * @submodule metal
 */
export default class Instrumentation {

  constructor() {
    throw new Error('Instrumentation is a static class and should not be instantiated');
  }

  /**
   * The internal event emitter used for notifications
   *
   * @private
   * @static
   */
  private static _emitter = new EventEmitter();

  /**
   * Subscribe to be notified when a particular instrumentation block completes.
   *
   * @static
   * @param {string} event
   * @param {(event: InstrumentationEvent) => void} callback
   */
  public static subscribe(event: string, callback: (event: InstrumentationEvent) => void) {
    this._emitter.on(event, callback);
  }

  /**
   * Unsubscribe from being notified when a particular instrumentation
   * block completes.
   *
   * @static
   * @param {string} event
   * @param {(event: InstrumentationEvent) => void} [callback]
   */
  public static unsubscribe(event: string, callback?: (event: InstrumentationEvent) => void) {
    this._emitter.removeListener(event, callback);
  }

  /**
   * Run the supplied function, timing how long it takes to complete. If the
   * function returns a promise, the timer waits until that promise resolves.
   * Returns a promise that resolves with the return value of the supplied
   * function. Fires an event with the given event name and event data (the
   * function result is provided as well).
   *
   * @static
   * @param {string} eventName
   * @param {*} data
   * @returns {InstrumentationEvent}
   */
  public static instrument(eventName: string, data: any): InstrumentationEvent {
    return new InstrumentationEvent(this._emitter, eventName, data);
  }

};

export class InstrumentationEvent {

  /**
   * @type {string}
   */
  public eventName: string;

  /**
   * @type {number}
   */
  public duration: number;

  /**
   * @type {*}
   */
  public data: any;

  /**
   * @private
   * @type {[ number, number ]}
   */
  private startTime: [ number, number ];

  /**
   * @private
   * @type {EventEmitter}
   */
  private emitter: EventEmitter;

  /**
   * Creates an instance of InstrumentationEvent.
   *
   * @param {EventEmitter} emitter
   * @param {string} eventName
   * @param {*} data
   */
  constructor(emitter: EventEmitter, eventName: string, data: any) {
    this.emitter = emitter;
    this.eventName = eventName;
    this.data = data;
    this.startTime = process.hrtime();
  }

  /**
   * Finish this event. Records the duration, and fires an event to any subscribers. Any data
   * provided here is merged with any previously provided data.
   *
   * @param {*} [data]
   */
  public finish(data?: any): void {
    this.duration = process.hrtime(this.startTime)[1];
    this.data = merge({}, this.data, data);
    this.emitter.emit(this.eventName, this);
  }

}
