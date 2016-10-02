#!/bin/bash

set -e

# Adapted from https://gist.github.com/domenic/ec8b0fc8ab45f39403dd

SOURCE_BRANCH="master"
BUILD_BRANCH="docs"
DEPLOY_BRANCH="gh-pages"

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
npm install

# Clone the repo and checkout the deploy branch
git clone $REPO docs-deploy
cd docs-deploy
git checkout $DEPLOY_BRANCH || git checkout --orphan $DEPLOY_BRANCH

# Back up to the build branch
cd ..

# Clean out deploy branch to prepare for a fresh build
rm -rf docs-deploy/**/* || exit 0

# Build the docs into a temporary dist folder (because broccoli can't build into
# an existing directory)
NODE_ENV=production node_modules/.bin/broccoli build dist

# Copy build resutls into the deploy branch
cp -r dist/* docs-deploy

# Now let's go have some fun with the deploy branch
cd docs-deploy

echo `git status`

# Commit the "changes", i.e. the new version.
git config user.name "Denali CI"
git config user.email "$COMMIT_AUTHOR_EMAIL"
git add . --all
git commit -m "Deploy to GitHub Pages: ${SHA}"

# Get the deploy key by using Travis's stored variables to decrypt deploy_key.enc
ENCRYPTED_KEY_VAR="encrypted_${ENCRYPTION_LABEL}_key"
ENCRYPTED_IV_VAR="encrypted_${ENCRYPTION_LABEL}_iv"
ENCRYPTED_KEY=${!ENCRYPTED_KEY_VAR}
ENCRYPTED_IV=${!ENCRYPTED_IV_VAR}
openssl aes-256-cbc -K $ENCRYPTED_KEY -iv $ENCRYPTED_IV -in ../deploy_key.enc -out ../deploy_key -d
chmod 600 ../deploy_key
eval `ssh-agent -s`
ssh-add ../deploy_key

# Now that we're all set up, we can push.
# git push $SSH_REPO $DEPLOY_BRANCH
