// We can't use the full transpiled syntax here because this file is imported by Denali's own
// denali-build.js. Since there's a bootstrapping problem here (Denali builds Denali), we can't
// transpile this file, because we need this file to transpile in the first place.
const path = require('path');
const escape = require('js-string-escape');
const Filter = require('broccoli-filter');
const { CLIEngine } = require('eslint');
const chalk = require('chalk');
const dedent = require('dedent-js');

const IGNORED_FILE_MESSAGE_REGEXP = /(?:File ignored by default\.)|(?:File ignored because of a matching ignore pattern\.)/;

module.exports = class LintTree extends Filter {

  constructor(inputNode, options = {}) {
    super(inputNode, options);

    this.extensions = [ 'js' ];
    this.targetExtension = 'js';
    this.rootDir = options.rootDir;
    this.generateTests = options.generateTests;
    if (this.generateTests) {
      this.targetExtension = 'lint-test.js';
    }

    this.cli = new CLIEngine();
  }

  processString(content, relativePath) {
    let report = this.cli.executeOnText(content, path.join(this.rootDir, relativePath));
    let result = report.results[0] || {};
    let messages = result.messages || [];

    messages = messages.filter((msg) => !IGNORED_FILE_MESSAGE_REGEXP.test(msg.message));

    if (this.generateTests) {
      return this.testGenerator(relativePath, messages);
    }

    if (messages.length > 0) {
      // eslint-disable-next-line no-console
      console.log(chalk.yellow(`${ path.join(this.rootDir, relativePath) } has ${ result.errorCount } errors and ${ result.warningCount } warnings.`));

      messages.forEach((error, index) => {
        // eslint-disable-next-line no-console
        console.log(chalk.yellow(dedent`
            ${ index + 1 }: ${ error.message } (${ error.ruleId }) at line ${ error.line }:${ error.column }
          ${ error.source }
        `));
      });
    }

    return content;
  }

  testGenerator(relativePath, errors) {
    let passed = errors.length === 0;
    let messages = `${ relativePath } should pass ESLint`;
    if (!passed) {
      messages += '\n\n';
      messages += errors.map((error) => {
        return `${ error.line }:${ error.column } - ${ error.message } (${ error.ruleId })`;
      }).join('\n');
    }
    let output = "import test from 'ava';\ntest((t) => {";
    if (passed) {
      output += "  t.pass('Linting passed.')\n";
    } else {
      output += `  t.fail('${ escape(messages) }');\n`;
    }
    output += '});\n';
    return output;
  }

};
