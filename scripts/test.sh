set -e
rm -rf tmp dist coverage .nyc_output
npm run bootstrap
yarn link
denali build
NODE_ENV=test nyc denali test --concurrency 2 --verbose "$@"
