import { json } from 'body-parser';

export default function middleware(router/*, application*/) {

  // Add your own middleware that will execute before Denali:
  // this.use(someMiddlewareFunction);

  // Parse any JSON request bodies
  router.use(json({ type: 'application/*+json' }));

}
