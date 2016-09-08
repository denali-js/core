# Denali Documentation

The Denali docs are built using Broccoli. The source files are on the `docs` branch,
and are written in Markdown. The `deploy.sh` script on the
`docs` branch will build the docs, copy them to this (`gh-pages`) branch, commit
and push them up.

## Installation

```sh
$ npm install -g broccoli-cli trash-cli
$ npm install
```

## Deploying

```sh
$ ./deploy.sh
```
