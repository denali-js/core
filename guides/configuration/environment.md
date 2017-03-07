---
title: Environment
---

The environment config file (`config/environment.js`) holds the configuration
that varies between environments. It should export a function that takes a
single `environment` argument (the string value of the current environment),
and returns a configuration object populated with whatever values are
appropriate.

Denali also supports `.env` files - if you create a `.env` file with variables
defined one-per-line, `NAME=VALUE`, then those variables will be loaded into
`process.env` before your `config/environment.js` file is executed:


```js
export default function environmentConfig(environment) {
  let config = {
    server: {
      port: process.env.PORT || 3000,
      detached: process.env.DETACHED
    },
    database: {
      url: process.env.DATABASE_URL // <- could be defined in /.env
    }
  };

  if (environment === 'development') {
    // development-specific config
  }

  if (environment === 'production') {
    // production-specific config

    // You can start Denali in SSL mode by providing your private key and
    // certificate, or your pfx file contents
    //
    //   config.server.ssl = {
    //     key: fs.readFileSync('privatekey.pem'),
    //     cert: fs.readFileSync('certificate.pem')
    //   };
    //
    // or,
    //
    //   config.server.ssl = {
    //     pfx: fs.readFileSync('server.pfx')
    //   };
    //
  }

  return config;
}
```