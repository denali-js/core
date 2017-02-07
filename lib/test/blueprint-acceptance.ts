import CommandAcceptanceTest from './command-acceptance';

export default class BlueprintAcceptanceTest extends CommandAcceptanceTest {

  blueprintName: string;

  constructor(blueprintName: string) {
    super('');
    this.blueprintName = blueprintName;
  }

  generate(args: string) {
    this.command = `generate ${ this.blueprintName } ${ args }`;
    return this.run();
  }

  destroy(args: string) {
    this.command = `destroy ${ this.blueprintName } ${ args }`;
    return this.run();
  }

}
