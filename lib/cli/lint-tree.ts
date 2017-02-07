import * as path from 'path';
import escape from 'js-string-escape';
import Filter from 'broccoli-filter';
import { CLIEngine } from 'eslint';
import * as chalk from 'chalk';
import dedent from 'dedent-js';
import { Tree } from './builder';

const IGNORED_FILE_MESSAGE_REGEXP = /(?:File ignored by default\.)|(?:File ignored because of a matching ignore pattern\.)/;

interface EslintError {
  message: string;
  ruleId: string;
  line: string;
  column: number;
  source: string;
}

export default class LintTree extends (<new(...args: any[]) => Tree>Filter) {

  extensions = [ 'js' ];
  targetExtension = 'js';

  rootDir: string;
  generateTests: boolean;
  cli: any;

  constructor(inputNode: string | Tree, options?: { rootDir: string, generateTests: boolean }) {
    super(inputNode, options);

    this.rootDir = options.rootDir;
    this.generateTests = options.generateTests;
    if (this.generateTests) {
      this.targetExtension = 'lint-test.js';
    }

    this.cli = new CLIEngine({ cwd: this.rootDir });
  }

  processString(content: string, relativePath: string): string {
    let report = this.cli.executeOnText(content, path.join(this.rootDir, relativePath));
    let result = report.results[0] || {};
    let messages: EslintError[] = result.messages || [];

    messages = messages.filter((msg: { message: string }) => !IGNORED_FILE_MESSAGE_REGEXP.test(msg.message));

    if (this.generateTests) {
      return this.testGenerator(relativePath, messages);
    }

    if (messages.length > 0) {
      // eslint-disable-next-line no-console
      console.log(chalk.yellow(`${ path.join(this.rootDir, relativePath) } has ${ result.errorCount } errors and ${ result.warningCount } warnings.`));

      messages.forEach((error, index: number) => {
        // eslint-disable-next-line no-console
        console.log(chalk.yellow(dedent`
            ${ index + 1 }: ${ error.message } (${ error.ruleId }) at line ${ error.line }:${ error.column }
          ${ error.source }
        `));
      });
    }

    return content;
  }

  testGenerator(relativePath: string, errors: EslintError[]): string {
    let passed = errors.length === 0;
    let messages = `${ relativePath } should pass ESLint`;
    if (!passed) {
      messages += '\n\n';
      messages += errors.map((error) => {
        return `${ error.line }:${ error.column } - ${ error.message } (${ error.ruleId })`;
      }).join('\n');
    }
    let output = '';
    if (passed) {
      output += "  t.pass('${ relativePath } passed ESLint')\n";
    } else {
      output += `  t.fail('${ escape(messages) }');\n`;
    }
    return output;
  }

}
