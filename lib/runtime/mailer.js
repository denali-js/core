/**
 * @module denali
 * @submodule runtime
 */
import nodemailer from 'nodemailer';
import { template as ejs } from 'lodash';

/**
 * Mailers represent email templates and any associated controller-style logic
 * that goes with them.
 *
 * @class Mailer
 * @constructor
 */
export default class Mailer {

  /**
   * A cache of mailer templates, keyed by their format.
   *
   * @property templateCache
   * @type {Object}
   * @private
   */
  templateCache = {};

  /**
   * The name of this mailer. Used in lookup (when you invoke the mail service),
   * logging (to identify the mailer), and templating (to find the related
   * templates).
   *
   * @property name
   * @type {String}
   * @private
   */
  name = null;

  constructor(container) {
    this.container = container;
    this.name = this.container.moduleNameFor(this.constructor).split(':')[1];
  }

  /**
   * This is the meat of any Mailer class. The `.send()` method is invoked
   * whenever the mailer is invoked, and is tasked with building and sending
   * whatever emails are necessary.
   *
   * The default implementation takes a `to`, `from`, and `subject` option, and
   * expects the body of the email to come from a template file with the same
   * name as the mailer (see `.template()`).
   *
   * You can override this function if you need to, for example, query a
   * database to fetch data to populate the email template with. By including
   * that logic here, it allows you to send this email from within an action,
   * from a background job, or somewhere else, and keep all that lookup logic
   * in one location.
   *
   * @method send
   * @param options {Object}
   * @return {Promise}
   */
  send(options = {}) {
    return this.mail({
      to: options.to,
      from: options.from,
      subject: options.subject,
      html: this.template('html', options),
      text: this.template('txt', options)
    });
  }

  /**
   * Intermediate method that does some housekeeping before actually calling
   * `sendMail()` to send the email:
   *
   *   * Logs the email send
   *   * Overrides in test environments and caches the "sent" email"
   *
   * This is implemented as a separate method for two reasons:
   *
   *   * It's easier / simpler to override sendMail, since it's **just** sending
   *     the email. Custom email senders don't need to worry about logging, etc
   *   * It ensures that no matter what custom email sender is implemented, test
   *     environment behavior remains the same
   *
   * You should **not** override this method. You are probably looking for
   * `sendMail()`.
   *
   * @method mail
   * @param {Object} options
   * @return {Promise}
   */
  mail(options) {
    let sent;
    if (this.config.environment === 'test') {
      this.container.lookup('application:main').emailsSent.push(options);
      sent = Promise.resolve();
    } else {
      sent = this.sendMail(options);
    }
    return sent.then(() => {
      this.logger.info(`mailer:${ this.constructor.name } - sent to ${ options.to }`);
    });
  }

  /**
   * Actually send an email. A simple wrapper over nodemailer's `.sendMail()`
   * method. See nodemailer docs for details.
   *
   * @method sendMail
   * @param options {Object}
   * @return {Promise}
   */
  sendMail(options = {}) {
    if (this.config.environment === 'test') {
      this.application = this;
    }
    let smtpTransport = this.container.lookup('mailer:smtp-transport');
    if (!smtpTransport) {
      let mailConfig = this.container.lookup('config:environment').mailer;
      smtpTransport = nodemailer.createTransport(mailConfig.transport);
      this.container.register('mailer:smtp-transport', smtpTransport);
    }
    return smtpTransport.sendMail(options);
  }

  /**
   * Lookup the template for this email, in the given format, and return the
   * result of applying the given data to that template.
   *
   * The default lookup behavior is to find a template file with the same name
   * as the mailer file (i.e. `app/mailers/welcome.js` would look for
   * `app/mailers/welcome.html).
   *
   * The default template engine is EJS.
   *
   * You can override this method to provide your own lookup semantics or
   * templating engine.
   *
   * @method template
   * @param format {String} the template format to lookup ('html' or 'text')
   * @param data {Object} the data to populate the template with
   * @return {String} the templated result
   */
  template(format, data) {
    if (!this.templateCache[format]) {
      let extension = this.extensionForFormat[format];
      let templateSrc = this.container.lookup(`mailer:${ this.constructor.name }.${ extension }`);
      this.templateCache[format] = ejs(templateSrc);
    }
    let template = this.templateCache[format];
    return template(data);
  }

}
