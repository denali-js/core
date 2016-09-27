set -e
npm run lint
npm test
npm run build
standard-version
npm publish
git push
