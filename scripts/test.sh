cd dist
NODE_ENV=test nyc mocha --recursive "$@"
