# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.0.17"></a>
# [0.0.17](https://github.com/denali-js/denali/compare/v0.0.16...v0.0.17) (2017-01-13)


### Bug Fixes

* **blueprint:** fix addon blueprint babel config ([e3462d1](https://github.com/denali-js/denali/commit/e3462d1))
* **blueprint:** fix outdated variable references in resource blueprint ([3925a95](https://github.com/denali-js/denali/commit/3925a95))
* **blueprint:** fix resource blueprint name patterns ([6148436](https://github.com/denali-js/denali/commit/6148436))
* **blueprint:** update package.jsons to reflect minimal babel plugin set ([a3b8a9a](https://github.com/denali-js/denali/commit/a3b8a9a))
* **cli:** build failures should cause test command to exit with non-zero code ([ae48297](https://github.com/denali-js/denali/commit/ae48297))
* **cli:** convert back to flat published addons, babel-register for denali-build.js ([a505f3b](https://github.com/denali-js/denali/commit/a505f3b))
* **cli:** fix flag handling in test command ([fd80091](https://github.com/denali-js/denali/commit/fd80091))
* **cli:** fix routes test to account for denali version printing ([1d47003](https://github.com/denali-js/denali/commit/1d47003))
* convert Denali's own denali-build.js to un-transpiled syntax ([3054c0b](https://github.com/denali-js/denali/commit/3054c0b))
* **cli:** retain non-transpiled files in denali's own build ([a8b9ebc](https://github.com/denali-js/denali/commit/a8b9ebc))
* use absolute path for instantiating project applications, improve failure messages ([23a260a](https://github.com/denali-js/denali/commit/23a260a))
* **cli:** tweak project handling to account for tmp holding dummy apps during tests ([371fea7](https://github.com/denali-js/denali/commit/371fea7))
* **util:** default spinner success message to the current spinner text ([b78e1d6](https://github.com/denali-js/denali/commit/b78e1d6))


### Features

* **blueprint:** add migration blueprint ([33578f9](https://github.com/denali-js/denali/commit/33578f9))
* **blueprint:** add orm-adapter blueprint ([6bcc07c](https://github.com/denali-js/denali/commit/6bcc07c))
* **blueprint:** add/remove routes from blueprints via jscodeshift ([8b6d7e4](https://github.com/denali-js/denali/commit/8b6d7e4))
* **cli:** add --litter flag to retain tmp dirs after tests finish ([aae9cba](https://github.com/denali-js/denali/commit/aae9cba))
* **cli:** add glob support to packageFiles array ([9707af8](https://github.com/denali-js/denali/commit/9707af8))
* **cli:** add migrate command ([7df3e4d](https://github.com/denali-js/denali/commit/7df3e4d))
* **cli:** add publish command ([f62c6c2](https://github.com/denali-js/denali/commit/f62c6c2))
* install knex on the fly in migrate command ([b5ba1eb](https://github.com/denali-js/denali/commit/b5ba1eb))
* **cli:** move default test output folder into tmp ([7e25fd3](https://github.com/denali-js/denali/commit/7e25fd3))
* **data:** add some sanity-check assertions to JSONAPISerializer parsing ([f895e3b](https://github.com/denali-js/denali/commit/f895e3b))
* **data:** add support for setting id to memory adapter ([367f135](https://github.com/denali-js/denali/commit/367f135))



<a name="0.0.16"></a>
# [0.0.16](https://github.com/denali-js/denali/compare/v0.0.15...v0.0.16) (2016-12-08)


### Bug Fixes

* **blueprint:** add babel-runtime, remove redundant async transform from default blueprints ([c13dff8](https://github.com/denali-js/denali/commit/c13dff8))
* **blueprint:** bring resource blueprint up to latest ([c410072](https://github.com/denali-js/denali/commit/c410072))
* **cli:** don't use es6 delimiters for blueprint templates ([a50c32e](https://github.com/denali-js/denali/commit/a50c32e))
* **cli:** fix build command watch flag ([ccab077](https://github.com/denali-js/denali/commit/ccab077))
* **cli:** fix install command ([18af3fb](https://github.com/denali-js/denali/commit/18af3fb))
* **test:** ensure addon dependency can link properly, even when cyclical ([8842266](https://github.com/denali-js/denali/commit/8842266))
* fix a couple test bugs, upgrade ava ([de25d9a](https://github.com/denali-js/denali/commit/de25d9a))
* get tests passing for shallow builds ([6b9e841](https://github.com/denali-js/denali/commit/6b9e841))


### Features

* **cli:** allow addons to omit app/ directory ([e5e3cac](https://github.com/denali-js/denali/commit/e5e3cac))
* **cli:** convert to shallow, precompiled builds ([9e5e20d](https://github.com/denali-js/denali/commit/9e5e20d))



<a name="0.0.15"></a>
# [0.0.15](https://github.com/denali-js/denali/compare/v0.0.14...v0.0.15) (2016-11-30)


### Bug Fixes

* **blueprint:** allow blueprints to float on 0.0.x versions of denali-babel and denali-eslint ([7873709](https://github.com/denali-js/denali/commit/7873709))
* **cli:** handle null exit code from test process ([1c42557](https://github.com/denali-js/denali/commit/1c42557))
* **cli:** inline dummy denali-build, update blueprint deps ([7f73a1c](https://github.com/denali-js/denali/commit/7f73a1c))


### Features

* **cli:** add concurrency limit flag to tests, and limit denalis own concurrency to avoid CI OOM ([f096aa7](https://github.com/denali-js/denali/commit/f096aa7))
* **cli:** add failOnStderr option to CommandAcceptanceTest.run() ([a8ad630](https://github.com/denali-js/denali/commit/a8ad630))
* **cli:** debug log the builder graph ([48c80de](https://github.com/denali-js/denali/commit/48c80de))



<a name="0.0.14"></a>
# [0.0.14](https://github.com/denali-js/denali/compare/v0.0.13...v0.0.14) (2016-11-27)


### Bug Fixes

* **cli:** change process title to denali ([06f8fed](https://github.com/denali-js/denali/commit/06f8fed))
* **cli:** default beforeRebuild to noop; fixes #223 ([f7150ff](https://github.com/denali-js/denali/commit/f7150ff)), closes [#223](https://github.com/denali-js/denali/issues/223)
* **cli:** default DEBUG_COLORS=1 for test command ([653ce7c](https://github.com/denali-js/denali/commit/653ce7c))
* **cli:** ensure polyfill loads before the rest of the imports in lib/index.js; see #221 ([249d256](https://github.com/denali-js/denali/commit/249d256))
* **cli:** fix version printing ([2cf7cfc](https://github.com/denali-js/denali/commit/2cf7cfc))
* **cli:** Make sure cli ENVs are not overwritten by defaults (#226) ([7dd7f18](https://github.com/denali-js/denali/commit/7dd7f18)), closes [#213](https://github.com/denali-js/denali/issues/213)
* **cli:** refactor test command to avoid concurrency issues with attempting to build while tests are still running ([99ccfbb](https://github.com/denali-js/denali/commit/99ccfbb))
* **cli:** remove undefined index.js line from help menu (#207) ([eb85ffe](https://github.com/denali-js/denali/commit/eb85ffe))
* **cli:** run processEach hooks _after_ processParent hooks ([f8894f4](https://github.com/denali-js/denali/commit/f8894f4))
* **cli:** stop leaking event emitters for server command; fixes #215 (#218) ([8f2e16c](https://github.com/denali-js/denali/commit/8f2e16c)), closes [#215](https://github.com/denali-js/denali/issues/215) [#218](https://github.com/denali-js/denali/issues/218)
* **cli:** stop the building spinner when the build errors ([5b79d08](https://github.com/denali-js/denali/commit/5b79d08))
* **cli:** swallow babel-polyfill errors from loading twice; fixes #221 ([5c0910c](https://github.com/denali-js/denali/commit/5c0910c)), closes [#221](https://github.com/denali-js/denali/issues/221)
* **data:** add sanity check for adapter returns from getRelated ([2deb3e4](https://github.com/denali-js/denali/commit/2deb3e4))
* **data:** default model constructor data arg to empty obj ([02b9f60](https://github.com/denali-js/denali/commit/02b9f60))
* **data:** ensure memory adapter methods are guaranteed async even when its a sync operation ([ae9ed3d](https://github.com/denali-js/denali/commit/ae9ed3d))
* **data:** ensure type is passed to adapter methods ([ab06b76](https://github.com/denali-js/denali/commit/ab06b76))
* **data:** fix inspect output for models, use eachAttribute ([4e1051f](https://github.com/denali-js/denali/commit/4e1051f))
* **data:** fix relationship accessor method lookup ([a87f804](https://github.com/denali-js/denali/commit/a87f804))
* **data:** return true to stop proxy from erroring ([8468c19](https://github.com/denali-js/denali/commit/8468c19))
* **data:** use findone for hasone relationships ([b195422](https://github.com/denali-js/denali/commit/b195422))
* **docs:** update to proper naming for addon (#208) ([e8374f8](https://github.com/denali-js/denali/commit/e8374f8))
* change static classes to singletons, use per-container subclasses to embed container references ([1994d3a](https://github.com/denali-js/denali/commit/1994d3a))
* ensure that babel-polyfill is always imported, no matter the invocation point ([57d476e](https://github.com/denali-js/denali/commit/57d476e))
* **runtime:** stop using re-export syntax to avoid hoisting imports ([1a0a74b](https://github.com/denali-js/denali/commit/1a0a74b))
* move denali back to regular deps in addon blueprint ([08f99d2](https://github.com/denali-js/denali/commit/08f99d2))
* remove babel-runtime, tests fail with it (not sure why tbh) ([03e6c69](https://github.com/denali-js/denali/commit/03e6c69))
* **runtime:** make availableForType() more strict in type lookups ([105903d](https://github.com/denali-js/denali/commit/105903d))
* **runtime:** Remove the mailer (#212) ([398f3d4](https://github.com/denali-js/denali/commit/398f3d4))
* **test:** add default value to app acceptance test helper method options ([6086f64](https://github.com/denali-js/denali/commit/6086f64))
* **test:** fix app acceptance helper handling of request body ([4b81334](https://github.com/denali-js/denali/commit/4b81334))
* **test:** fix app acceptance test helper paths and request sugar ([3a94f58](https://github.com/denali-js/denali/commit/3a94f58))
* **test:** fix assumption that options.method existed ([b61884b](https://github.com/denali-js/denali/commit/b61884b))


### Features

* **blueprint:** add denali-build.js to app/addon blueprints ([8062dd4](https://github.com/denali-js/denali/commit/8062dd4))
* **blueprint:** add MIT license to addon blueprint ([a35c2f5](https://github.com/denali-js/denali/commit/a35c2f5))
* **blueprint:** add some helpful default config files to app & addon blueprints ([f549c96](https://github.com/denali-js/denali/commit/f549c96))
* **cli:** add --serial flag to test command ([b257d59](https://github.com/denali-js/denali/commit/b257d59))
* **cli:** add building spinner indicator ([9dff265](https://github.com/denali-js/denali/commit/9dff265))
* **cli:** add fail-fast arg to test command ([3a57d80](https://github.com/denali-js/denali/commit/3a57d80))
* **cli:** add ignoreVulnerabilities property to Builder class; fixes #209 ([1890e71](https://github.com/denali-js/denali/commit/1890e71)), closes [#209](https://github.com/denali-js/denali/issues/209)
* **cli:** allow addons to modify builds (#214) ([209f33a](https://github.com/denali-js/denali/commit/209f33a))
* **cli:** print-slow-trees flag for several commands (#205) ([cb8ba76](https://github.com/denali-js/denali/commit/cb8ba76))
* **data:** add findOne to adapter api ([8dca36f](https://github.com/denali-js/denali/commit/8dca36f))
* **data:** add initializer to allow ORM adapters to define their own internal models ([4f18c55](https://github.com/denali-js/denali/commit/4f18c55))
* **data:** add Model.eachRelationship() ([27d3973](https://github.com/denali-js/denali/commit/27d3973))
* **data:** add Model.findOne() ([9f24878](https://github.com/denali-js/denali/commit/9f24878))
* **data:** add setId to adapter api ([1478d4e](https://github.com/denali-js/denali/commit/1478d4e))
* add debug logging ([202a20a](https://github.com/denali-js/denali/commit/202a20a))
* **runtime:** add request id via our request class ([5b9cf6f](https://github.com/denali-js/denali/commit/5b9cf6f))
* **test:** add `environment` and `failOnStderr` options to ([29c9cca](https://github.com/denali-js/denali/commit/29c9cca))
* **test:** improve spawn command failure output ([38dd2de](https://github.com/denali-js/denali/commit/38dd2de))



<a name="0.0.13"></a>
## [0.0.13](https://github.com/denali-js/denali/compare/v0.0.12...v0.0.13) (2016-10-29)


### Bug Fixes

* **cli:** fix babel ignore to compile unlinked addons ([b1dc222](https://github.com/denali-js/denali/commit/b1dc222))



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
