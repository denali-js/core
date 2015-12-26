export default function environmentConfig() {
  let config = {
    server: {
      port: process.env.PORT || 3000
    }
  };

  return config;
}
