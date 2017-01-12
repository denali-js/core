set -e
rm -rf tmp dist
NODE_ENV=test nyc ./bin/denali test --concurrency 2 --verbose "$@"
