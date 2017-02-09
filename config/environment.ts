module.exports = function baseConfig(environment: string, appConfig: any) {
  if (!appConfig.logging) {
    appConfig.logging = {};
  }
  if (!appConfig.logging.hasOwnProperty('showDebuggingInfo')) {
    appConfig.logging.showDebuggingInfo = environment !== 'production';
  }
};
