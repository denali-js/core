#!/bin/bash

set -e

tmpdir=`mktemp -d`

if [ -n "$(git status --porcelain)" ]; then
  echo "You have uncommitted changes - please commit or stash before deploying."
  exit 1
fi

jekyll build --destination $tmpdir

git checkout gh-pages
trash ./*
cp -r $tmpdir/ ./
git add .
git commit -m 'update docs'
git push origin gh-pages
git checkout docs

rm -rf $tmpdir
