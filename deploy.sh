#!/bin/bash

set -e

if [ -n "$(git status --porcelain)" ]; then
  echo "You have uncommitted changes - please commit or stash before deploying."
  exit 1
fi

echo "Creating tmp directories to work with"
tmpdir=`mktemp -d`
node_modules_backup=`mktemp -d`

echo "Cleaning up previous builds"
rm -rf dist

echo "Building"
NODE_ENV=production node_modules/.bin/broccoli build $tmpdir/dist

echo "Backing up node_modules"
mv node_modules $node_modules_backup/

echo "Checking out gh-pages branch"
git checkout gh-pages

echo "Cleaning gh-pages branch"
rm -rf ./*

echo "Copying over build result"
cp -r $tmpdir/dist/ ./

echo "Updating gh-pages branch with new build"
git add .
git commit -m 'update docs'

echo "Pushing gh-pages branch"
git push origin gh-pages

echo "Restoring docs branch and node_modules"
git checkout docs
mv $node_modules_backup/node_modules ./

echo "Cleaning up tmp directories"
rm -rf $tmpdir $node_modules_backup
