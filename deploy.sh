#!/bin/bash

set -e

tmpdir=`mktemp -d`
node_modules_backup=`mktemp -d`

if [ -n "$(git status --porcelain)" ]; then
  echo "You have uncommitted changes - please commit or stash before deploying."
  exit 1
fi

trash dist
NODE_ENV=production broccoli build $tmpdir/dist

mv node_modules $node_modules_backup/

git checkout gh-pages
trash ./*
cp -r $tmpdir/dist/ ./
git add .
git commit -m 'update docs'
git push origin gh-pages
git checkout docs

mv $node_modules_backup/node_modules ./

rm -rf $tmpdir $node_modules_backup
