import { Blueprint } from 'denali-cli';

export default class <%= className %>Blueprint extends Blueprint {

  static blueprintName = '<%= name %>';
  static description = 'Installs <%= name %>';

  locals(/* argv */) {
    console.log("This blueprint is run when <%= name %> is installed via `denali install`. It's a good spot to make any changes to the consuming app or addon, i.e. create a config file, add a route, etc");
  }

}
