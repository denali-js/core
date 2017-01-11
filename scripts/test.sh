set -e
rm -rf tmp dist
NODE_ENV=test ./bin/denali test --concurrency 2 --verbose "$@"
