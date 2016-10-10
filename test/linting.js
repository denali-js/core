import lint from 'mocha-eslint';

lint([
  '../lib/**/*.js',
  '../test/**/*.js',
  '!../lib/cli/blueprints/*/files/**/*'
]);
