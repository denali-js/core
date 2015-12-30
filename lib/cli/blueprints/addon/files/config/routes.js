export default function drawRoutes() {

  /*
   * # Single routes
   *
   * If you have some custom endpoint you want to create, you can always add it
   * via the basic routing DSL:
   *
   *     this.post('/foo', 'foo', 'process')
   *          └┬─┘ └┬───┘  └┬──┘  └┬──────┘
   *           │    │       │      └ action name
   *           │    │       └ controller
   *           │    └ URL pattern
   *           └ HTTP method
   *
   * That will create an endpoint that responds to a POST /foo, and triggers the
   * `process` action on the `foo` controller.
   *
   *
   * # Resources
   *
   * Single routes are useful, but Denali's real power comes from resources.
   * Using just:
   *
   *     this.resource('book')
   *
   * sets up the following routes
   *
   * Method  | URL                                               | Action
   * --------|---------------------------------------------------|-------
   * GET     | /books                                            | list
   * POST    | /books                                            | create
   * GET     | /books/:book_id                                   | show
   * PATCH   | /books/:book_id                                   | update
   * DELETE  | /books/:book_id                                   | destroy
   * GET     | /books/:book_id/:relationship_name                | fetch[relationshipName]
   * GET     | /books/:book_id/relationships/:relationship_name  | fetch[relationshipName]Relationship
   * POST    | /books/:book_id/relationships/:relationship_name  | add[relationshipName]Relationship
   * PATCH   | /books/:book_id/relationships/:relationship_name  | replace[relationshipName]Relationship
   * DELETE  | /books/:book_id/relationships/:relationship_name  | remove[relationshipName]Relationship
   *
   */

}
