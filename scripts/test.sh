set -e
rm -rf tmp dist coverage .nyc_output
npm run bootstrap
cd dist
yarn link
cd ..
denali build
NODE_ENV=test nyc denali test --concurrency 2 --verbose "$@"
