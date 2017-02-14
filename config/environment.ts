module.exports = function baseConfig(environment: string, appConfig: any): void {
  if (!appConfig.logging) {
    appConfig.logging = {};
  }
  if (!appConfig.logging.hasOwnProperty('showDebuggingInfo')) {
    appConfig.logging.showDebuggingInfo = environment !== 'production';
  }
};
