---
title: Mailers
---

# Mailers

Most web applications of non-trivial size will need to send emails to users.
Denali's Mailers provide a convention-based, out of the box solution that scales
from simple transactional emails all the way up to complex digests, all while
abstracting the emails from the method of sending (i.e. SES, Mandrill, Sendgrid,
etc).

## Concepts

Denali exposes a `Mailer` class, which represents an email that is sent. It
captures all the associated logic of that email - if it needs to lookup data
from a database, that happens in the Mailer class. Mailers are defined in
`app/mailers/`.

Each Mailer class is paired with template files to define the body of the email.
By convention, the template files are stored right next to mailer files, and use
the same name (but different extensions - one for the HTML version of the email,
and one for the plain text version):

    app/
      mailers/
        welcome.js   <- The mailer class
        welcome.html <- The HTML version of the email body
        welcome.txt  <- The plain text version of the email body

It's not required to have both a plain text and HTML version of an email -
either one is fine alone.

## Creating a Mailer

To get started sending emails, let's create a mailer. You can use the `generate`
command in the Denali CLI to scaffold out a new mailer for you:

    $ denali generate mailer welcome

This will create a blank mailer for us. In this case, we're building a welcome
email to send after a user signs up. Now lets update the scaffolded templates
with our welcome message:

    // app/mailers/welcome.html
    <!DOCTYPE html>
    <html>
      <head>
        <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
      </head>
      <body>
        <h1>Welcome to example.com, <%= user.name %>!</h1>
        <p>Thanks for joining and have a great day!</p>
      </body>
    </html>

And our plain text version (it's usually a good idea to have both, since some
email clients prefer plain text to HTML):

    // app/mailers/welcome.txt
    Welcome to example.com, <%= user.name %>!
    Thanks for joining and have a great day!

Notice our template tags in both templates, where we dynamically insert the
user's name into the template.

Now, if we wanted to pull in additional data, we could override the `welcome.js`
mailer's `send()` method, like this:

    // app/mailers/welcome.js
    import { Mailer } from 'denali';

    export default class WelcomeMailer extends Mailer {
      send(user) {
        let Topic = this.modelFor('topic');
        return Topic.findInteresting().then((interestingTopics) => {
          return this.mail({
            to: user.email,
            from: 'notifications@example.com',
            subject: 'Welcome!',
            html: this.template('html', { user, interestingTopics }),
            text: this.template('text', { user, interestingTopics })
          });
      }
    }

Notice that we use `this.mail({ to, from, subject, html, text })` to actually
send the email once we've gathered all the relevant data.

## Sending the email

Now that we have a mailer ready to go, let's wire it up to a `users/sign-up`
action so that new users will be sent a welcome email:

    // app/actions/users/sign-up.js
    respond(params) {
      let User = this.modelFor('user');
      return User.create(params).then((newUser) => {
        this.mail('welcome', newUser);
        return newUser;
      });
    }

As we can see, actions come with a `this.mail` method which invoke the named
mailer with the data supplied (in this case, our new user record).

Notice also that, despite `this.mail()` returning a Promise, we don't wait for
it to finish the action. This let's us leverage Node's asynchronous behavior to
finish the request as soon as possible rather than waiting for the email to
finish before responding to the incoming request.
