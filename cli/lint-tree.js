import path from 'path';
import escape from 'js-string-escape';
import Filter from 'broccoli-filter';
import { CLIEngine } from 'eslint';

const IGNORED_FILE_MESSAGE_REGEXP = /(?:File ignored by default\.)|(?:File ignored because of a matching ignore pattern\.)/;

export default class LintTree extends Filter {

  extensions = [ 'js' ];
  targetExtension = 'js';

  constructor(inputNode, options = {}) {
    super(inputNode, options);

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
    let errors = result.messages || [];

    errors = errors.filter((error) => !IGNORED_FILE_MESSAGE_REGEXP.test(error.message));

    if (this.generateTests) {
      return this.testGenerator(relativePath, errors);
    }

    errors.forEach((error) => console.log(error)); // eslint-disable-line no-console
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

}
