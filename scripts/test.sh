set -e
rm -rf tmp
rm -rf node_modules/denali
rsync -aq --progress . node_modules/denali --exclude node_modules --exclude .git
NODE_ENV=test ./bin/denali test "$@"
