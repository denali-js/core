#!/bin/bash

set -e

# Adapted from https://gist.github.com/domenic/ec8b0fc8ab45f39403dd

SOURCE_BRANCH="master"
BUILD_BRANCH="docs"

# Pull requests and commits to other branches shouldn't try to deploy, just build to verify
if [ "$TRAVIS_PULL_REQUEST" != "false" -o "$TRAVIS_BRANCH" != "$SOURCE_BRANCH" ]; then
    echo "Skipping docs deploy."
    exit 0
fi

# Save some useful information
REPO=`git config remote.origin.url`
SSH_REPO=${REPO/https:\/\/github.com\//git@github.com:}
SHA=`git rev-parse --verify HEAD`

# Clone the repo and checkout the build branch, and install build dependencis
git clone $REPO docs-build
cd docs-build
git checkout $BUILD_BRANCH
yarn install

# Build the docs into a temporary dist folder (because broccoli can't build into
# an existing directory)
npm run build
npm run deploy