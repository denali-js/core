set -e
rm -rf tmp dist
npm run bootstrap
denali build
NODE_ENV=test nyc denali test --concurrency 2 --verbose "$@"
