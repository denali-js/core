import CommandAcceptanceTest from './command-acceptance';

export default class BlueprintAcceptanceTest extends CommandAcceptanceTest {

  constructor(blueprintName) {
    super();
    this.blueprintName = blueprintName;
  }

  generate(args) {
    this.command = `generate ${ this.blueprintName } ${ args }`;
    return this.run();
  }

  destroy(args) {
    this.command = `destroy ${ this.blueprintName } ${ args }`;
    return this.run();
  }

  spawn() {
    throw new Error('Spawn is not supported.');
  }

}
