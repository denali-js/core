# Denali Documentation

The Denali docs are a Jekyll site. The source files are on the `docs` branch,
and it leverages the `_plugins/yuidoc.rb` plugin to read the documentation
source from the various source branches and tags. The `deploy.sh` script on the
`docs` branch will build the docs, copy them to this (`gh-pages`) branch, commit
and push them up.

## Installation

```sh
$ bundle install
$ npm install -g yuidocjs
```

## Developing

```sh
$ bundle exec jekyll serve
```
