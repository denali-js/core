set -e
rm -rf tmp
rm -rf node_modules/denali
rsync -aq --progress . node_modules/denali --exclude node_modules --exclude .git --exclude tmp --exclude dist --exclude .nyc_output
NODE_ENV=test ./bin/denali test --concurrency 2 --verbose "$@"
