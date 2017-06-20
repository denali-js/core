#!/bin/bash

set -e

if ! hash aws 2>/dev/null; then
    echo "AWS CLI not found, installing locally"
    curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"
    unzip awscli-bundle.zip
    ./awscli-bundle/install -b ~/bin/aws
    export PATH=~/bin:$PATH
    aws configure set preview.cloudfront true
fi

# Adapted from https://gist.github.com/domenic/ec8b0fc8ab45f39403dd

SOURCE_BRANCH="master"
BUILD_BRANCH="docs"

# Pull requests and commits to other branches shouldn't try to deploy, just build to verify
if [ "$CI" == "true" ]; then
    if [ "$TRAVIS_PULL_REQUEST" != "false" ] || [ "$TRAVIS_BRANCH" != "$SOURCE_BRANCH" ]; then
        echo "Skipping docs deploy."
        exit 0
    fi
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
