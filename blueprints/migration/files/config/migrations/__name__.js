export async function up(knex) {
  return knex.schema.createTable('posts', (posts) => {
    post.text('title');
  });
}

export async function down(knex) {
  return knex.schema.dropTable('posts');
}
