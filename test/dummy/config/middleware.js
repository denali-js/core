export default function middleware(router/*, application*/) {

  router.use((req, res, next) => {
    res.set('X-Middleware-Test', 'foo');
    next();
  });

}
