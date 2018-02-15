---
title: Addons
---

**In progress ...**

We are hard at work fleshing out the remaining docs. Want to help? Just click
the "Improve this page" link and chip in!

## Installing An Addon

To install an addon, it must first be published to npm. Once you know what
the addon is published as, you can use the install command.

```sh
$ denali install addon-name
```

## Generating An Addon

To generate a new addon project you can use the following command

```sh
$ denali addon my-addon
```

This will create a new directory with all of the necessary files
to get you started writing your first addon.

## Addon Structure

Addons use a similar structure to a regular app.

- `app` - Anything in this directory will be available on the container in the consuming app.
- `lib` - Anything you want to add here will have to be explicitly imported.
