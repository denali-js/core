<a name="0.0.12"></a>
## [0.0.12](https://github.com/denali-js/denali/compare/v0.0.11...v0.0.12) (2016-10-28)


### Bug Fixes

* **test:** bump spawned command timeout to 10 freakin minutes ... ([1570b3e](https://github.com/denali-js/denali/commit/1570b3e))
* remove npmignore and package.json "files" ([f6e7538](https://github.com/denali-js/denali/commit/f6e7538))
* **test:** link local denali into generated fixture app, rather than relying on latest registry version ([d991483](https://github.com/denali-js/denali/commit/d991483))


### Features

* **test:** expose projectRoot on CommandAcceptanceTest class ([eb5b666](https://github.com/denali-js/denali/commit/eb5b666))
* **test:** reject the spawned command promise when failOnStderr is true ([7c64a35](https://github.com/denali-js/denali/commit/7c64a35))



<a name="0.0.11"></a>
## [0.0.11](https://github.com/denali-js/denali/compare/v0.0.10...v0.0.11) (2016-10-28)


### Bug Fixes

* **blueprint:** Remove duplicate eslint dep in app blueprint (#152) ([cf174f4](https://github.com/denali-js/denali/commit/cf174f4))
* **blueprints:** add async generator plugin to app/addon blueprints ([b4f1166](https://github.com/denali-js/denali/commit/b4f1166))
* **blueprints:** add dummy app to addon blueprint; fixes #178 ([cce6d1d](https://github.com/denali-js/denali/commit/cce6d1d)), closes [#178](https://github.com/denali-js/denali/issues/178)
* **blueprints:** add error handling for when app blueprint dependency install fails ([6be3f14](https://github.com/denali-js/denali/commit/6be3f14))
* **blueprints:** config/routes.js comment for app and addon (#112) ([4c47e05](https://github.com/denali-js/denali/commit/4c47e05))
* **blueprints:** update blueprints to use ava (#182) ([e174aa9](https://github.com/denali-js/denali/commit/e174aa9)), closes [#179](https://github.com/denali-js/denali/issues/179)
* **cli:** add async plugin back to babel config, remove Brocfile ([19b7bce](https://github.com/denali-js/denali/commit/19b7bce))
* **cli:** cleanup build process for addons ([5fda03d](https://github.com/denali-js/denali/commit/5fda03d))
* **cli:** default options to empty object ([bc8941c](https://github.com/denali-js/denali/commit/bc8941c))
* **cli:** display intelligent error message when blueprint is not found ([e7d6d20](https://github.com/denali-js/denali/commit/e7d6d20))
* **cli:** don't assume nested dependencies when symlinking addons into a build ([23113a8](https://github.com/denali-js/denali/commit/23113a8))
* **cli:** don't silence CLI output in test environment (since the CLI's output might be asserted against) ([a4cadcb](https://github.com/denali-js/denali/commit/a4cadcb))
* **cli:** don't use dummy app to discover addons when building an addon ([24bb7dc](https://github.com/denali-js/denali/commit/24bb7dc))
* **cli:** ensure blueprints dir exists before trying to load it ([1811947](https://github.com/denali-js/denali/commit/1811947))
* **cli:** ensure nested node_modules folders are created before attempting to link their contents ([5b4bb1d](https://github.com/denali-js/denali/commit/5b4bb1d))
* **cli:** fix ability to load up addons again after changes in #123 (#156) ([651042d](https://github.com/denali-js/denali/commit/651042d)), closes [#123](https://github.com/denali-js/denali/issues/123) [#156](https://github.com/denali-js/denali/issues/156)
* **cli:** fix addon tests via dummy app ([a27ac36](https://github.com/denali-js/denali/commit/a27ac36))
* **cli:** fix babel ignore paths ([3414491](https://github.com/denali-js/denali/commit/3414491))
* **cli:** Fix create application (#187) ([c2bf761](https://github.com/denali-js/denali/commit/c2bf761)), closes [#187](https://github.com/denali-js/denali/issues/187) [#155](https://github.com/denali-js/denali/issues/155)
* **cli:** fix destroy command file deletion ([5e39c38](https://github.com/denali-js/denali/commit/5e39c38))
* **cli:** fix skip-audit and skip-lint flags for test command ([a2907a8](https://github.com/denali-js/denali/commit/a2907a8))
* **cli:** fix some build path bugs and remove hardcoded "dist" (#149) ([fe26a37](https://github.com/denali-js/denali/commit/fe26a37)), closes [#149](https://github.com/denali-js/denali/issues/149) [#146](https://github.com/denali-js/denali/issues/146) [#145](https://github.com/denali-js/denali/issues/145)
* **cli:** fix static config for RootCommand ([afb9b7b](https://github.com/denali-js/denali/commit/afb9b7b))
* **cli:** fix typo in resource blueprint description (#110) ([c62d747](https://github.com/denali-js/denali/commit/c62d747)), closes [#110](https://github.com/denali-js/denali/issues/110)
* **cli:** Give linting logs a bit more context (#185) ([6c674d2](https://github.com/denali-js/denali/commit/6c674d2))
* **cli:** improve process cleanup handling for server command ([0d6ba02](https://github.com/denali-js/denali/commit/0d6ba02))
* **cli:** load addons recursively ([29cbc06](https://github.com/denali-js/denali/commit/29cbc06))
* **cli:** move cli into lib, allowing exports from lib/index.js (#199) ([95ca5f1](https://github.com/denali-js/denali/commit/95ca5f1)), closes [#191](https://github.com/denali-js/denali/issues/191)
* **cli:** move istanbul plugin out of default build ([d655cc3](https://github.com/denali-js/denali/commit/d655cc3))
* **cli:** pass absolute paths into Builder.treeFor* methods ([e9a3c30](https://github.com/denali-js/denali/commit/e9a3c30))
* **cli:** prevent errors if nsp items do not have recommendations ([0510c18](https://github.com/denali-js/denali/commit/0510c18))
* **cli:** prevent event listener memory leak for test cleanup ([e67399d](https://github.com/denali-js/denali/commit/e67399d))
* **cli:** test command exits with non-zero exit code for failures ([8a8d4ba](https://github.com/denali-js/denali/commit/8a8d4ba))
* **data:** ensure parent class attributesCache is not used; fixes #127 ([626fae6](https://github.com/denali-js/denali/commit/626fae6)), closes [#127](https://github.com/denali-js/denali/issues/127)
* **data:** fix double instantiation of models (#119) ([dca0b04](https://github.com/denali-js/denali/commit/dca0b04)), closes [#119](https://github.com/denali-js/denali/issues/119)
* **data:** pluralize types in json-api serializer (#114) ([cb3ab7e](https://github.com/denali-js/denali/commit/cb3ab7e))
* **docs:** fix a typo (#201) ([1e21451](https://github.com/denali-js/denali/commit/1e21451)), closes [#201](https://github.com/denali-js/denali/issues/201)
* **runtime:** do not fallback to application serializer when action.serializer = false; closes #161 (#192) ([bde2c74](https://github.com/denali-js/denali/commit/bde2c74)), closes [#161](https://github.com/denali-js/denali/issues/161) [#192](https://github.com/denali-js/denali/issues/192)
* **runtime:** ensure config dir exists before attempting to load config files ([2669822](https://github.com/denali-js/denali/commit/2669822))
* **runtime:** fix addon loading ([15bdbc1](https://github.com/denali-js/denali/commit/15bdbc1))
* **runtime:** Instantiate singletons automatically ([3a5f8b9](https://github.com/denali-js/denali/commit/3a5f8b9))
* **test:** bump spawn command timeout for command acceptance test helper ([5a93882](https://github.com/denali-js/denali/commit/5a93882))
* **test:** fix dummy app package.json ([091b084](https://github.com/denali-js/denali/commit/091b084))
* **test:** header typo in app-acceptance helper (#200) ([7e7b8de](https://github.com/denali-js/denali/commit/7e7b8de))
* inline eslint rules for test folder ([a85bc49](https://github.com/denali-js/denali/commit/a85bc49))


### Features

* **blueprints:** add --use-npm flag to force npm instead of yarn; update tests to use npm until yarn concurrency bug is resolved (see yarkpkg/yarn#1275) ([911fa95](https://github.com/denali-js/denali/commit/911fa95)), closes [yarkpkg/yarn#1275](https://github.com/yarkpkg/yarn/issues/1275)
* **blueprints:** add a .editorconfig (#142) ([39330c1](https://github.com/denali-js/denali/commit/39330c1))
* **blueprints:** support yarn in addon blueprint ([1a72c71](https://github.com/denali-js/denali/commit/1a72c71))
* **build:** convert denali to an addon & build addons on-the-fly (#172) ([99bf90e](https://github.com/denali-js/denali/commit/99bf90e))
* **cli:** --debug flag support for server & test command; fix #87 ([5ebcc7f](https://github.com/denali-js/denali/commit/5ebcc7f)), closes [#87](https://github.com/denali-js/denali/issues/87)
* **cli:** add --skip-npm flag to new and addon commands ([7bc2e30](https://github.com/denali-js/denali/commit/7bc2e30))
* **cli:** add support back for .babelrc files ([a8f27bd](https://github.com/denali-js/denali/commit/a8f27bd))
* **cli:** add timeout flag to test command ([b41a577](https://github.com/denali-js/denali/commit/b41a577))
* **cli:** add verbose flag to test command ([cd96964](https://github.com/denali-js/denali/commit/cd96964))
* **cli:** add yarn support to denali new command (#150) ([6d403b9](https://github.com/denali-js/denali/commit/6d403b9))
* **cli:** broccoli-based builds (#123) ([1086be0](https://github.com/denali-js/denali/commit/1086be0))
* **cli:** Check node version and error if < 6 (#151) ([75699bc](https://github.com/denali-js/denali/commit/75699bc))
* **cli:** New `routes` command printing all routes (#111) ([8ba1469](https://github.com/denali-js/denali/commit/8ba1469))
* **data:** Add Model#eachAttribute (#118) ([a60a914](https://github.com/denali-js/denali/commit/a60a914))
* **data:** expose memory orm-adapter cache (#115) ([3c11a64](https://github.com/denali-js/denali/commit/3c11a64))
* **data:** pass entire response object to serializer (#175) ([a8b5de9](https://github.com/denali-js/denali/commit/a8b5de9))
* **data:** pass model to orm adapter (#116) ([5dc29f4](https://github.com/denali-js/denali/commit/5dc29f4))
* **data:** set content type headers in serializers (#176) ([9add7f8](https://github.com/denali-js/denali/commit/9add7f8))
* **router:** run middleware layer prior to routing (#189) ([cf27d89](https://github.com/denali-js/denali/commit/cf27d89))
* **runtime:** add default logging levels per environment ([39e754c](https://github.com/denali-js/denali/commit/39e754c))
* **test:** add acceptance test helpers for app, blueprint, and command ([757e379](https://github.com/denali-js/denali/commit/757e379))
* **test:** allow users to supply an environment when running a CommandAcceptanceTest ([001ae50](https://github.com/denali-js/denali/commit/001ae50))
* **test:** automatically add transfer-encoding: chunked to mock requests with bodies ([b944276](https://github.com/denali-js/denali/commit/b944276))
* **test:** automatically increase spawned command acceptance timeout in CI environments ([aa2088a](https://github.com/denali-js/denali/commit/aa2088a))
* **test:** remove acceptance class helper functions, fix command and blueprint acceptance test classes ([824352c](https://github.com/denali-js/denali/commit/824352c))
* **test:** switch to ava as test runner ([28dd8b1](https://github.com/denali-js/denali/commit/28dd8b1))



# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.0.10"></a>
## [0.0.10](https://github.com/denali-js/denali/compare/v0.0.9...v0.0.10) (2016-09-27)


### Bug Fixes

* **code style:** remove unused import ([70a0fed](https://github.com/denali-js/denali/commit/70a0fed))



<a name="0.0.9"></a>
## [0.0.9](https://github.com/denali-js/denali/compare/v0.0.8...v0.0.9) (2016-09-27)


### Bug Fixes

* **blueprint:** fix outdated app blueprint test ([6f3da1e](https://github.com/denali-js/denali/commit/6f3da1e))
* **cli:** Fix local and global denali version ([e733ca2](https://github.com/denali-js/denali/commit/e733ca2))
