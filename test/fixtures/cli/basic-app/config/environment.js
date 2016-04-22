export default function environmentConfig(environment) {
  let config = {
    server: {
      port: process.env.PORT || 3000
    },
    database: {

    }
  };

  if (environment === 'development') {
    // development-specific config
  }

  if (environment === 'production') {
    // production-specific config
  }

  return config;
}
