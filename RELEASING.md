# Release procedure

* Do a clean build (`npm run build`)
* Make sure tests pass locally and on CI
* Update package.json version and app & addon blueprint package.json versions
* Update CHANGELOG.md
* `npm publish`
* Publish docs (`git checkout docs && ./deploy.sh`)
