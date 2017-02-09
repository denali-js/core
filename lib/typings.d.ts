declare module "*.json" {
  const value: any;
  export default value;
}

declare module "walk-sync";
declare module "jscodeshift";
declare module "broccoli-funnel";
declare module "broccoli-merge-trees";
declare module "js-string-escape";
declare module "broccoli-filter";
declare module "broccoli-plugin";
declare module "dedent-js";
declare module "eslint";
declare module "nsp";
declare module "ware";
declare module "arrify";
declare module "type-is";
declare module "try-require";
declare module "is-directory";
declare module "strip-extension";
declare module "wordwrap";
declare module "broccoli";
declare module "broccoli/lib" {
  class Watcher {
    constructor(tree: any, options: any)
    detectChanges():string[]
  }
}
declare module "broccoli-slow-trees";
declare module "copy-dereference";
declare module "command-exists";
declare module "cli-table2";