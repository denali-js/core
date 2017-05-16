export default {
  name: 'unhandled-promises',
  initialize(): void {
    process.on('unhandledRejection', (reason: any) => {
      // tslint:disable-next-line:no-console
      console.error(reason.stack || reason.message || reason);
    });
  }
};