const path = require('path');
const { mv } = require('broccoli-stew');
const MergeTree = require('broccoli-merge-trees');
const SassPlugin = require('broccoli-sass');
const globalData = require('./build/lib/global-data');
const FindBuildTargets = require('./build/plugins/find-build-targets');
const CheckoutVersions = require('./build/plugins/checkout-versions');
const ExtractYuidocs = require('./build/plugins/extract-yuidocs');
const CompileAPIDocs = require('./build/plugins/compile-api-docs');
const CompileGuides = require('./build/plugins/compile-guides');
const CreateVersionAliases = require('./build/plugins/create-version-aliases');
const CompileStaticPages = require('./build/plugins/compile-static-pages');

const config = require('./config.js');
Object.assign(globalData, config.data);

let targets = new FindBuildTargets(config.versions);
let versions = new CheckoutVersions(targets);
let yuidocs = new ExtractYuidocs(versions);

let includes = mv(path.join('src', 'includes'), 'includes');
let templatesDir = path.join('src', 'templates');

let apidocs = new CompileAPIDocs(yuidocs, { templatesDir, includes, versionConfig: config.versions });
let guides = new CompileGuides(versions, { templatesDir, includes, versionConfig: config.versions });
let docs = new MergeTree([ guides, apidocs ]);
let aliases = new CreateVersionAliases(docs, config.versions);

let pages = new CompileStaticPages(new MergeTree([ 'src/pages', includes ]));
let sass = new MergeTree([ 'bower_components', 'src/styles' ]);
let styles = new SassPlugin([ sass ], 'app.scss', 'styles.css');
let assets = 'src/public';

let result = new MergeTree([ docs, aliases, pages, styles, assets ]);

module.exports = result;
