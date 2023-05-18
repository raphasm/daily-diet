import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary()
    table.text('snack').notNullable()
    table.text('description').notNullable()
    table.text('date').notNullable()
    table.text('time').notNullable()
    table.boolean('isOnDiet').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()

    // relacionamento
    table.uuid('user_id').references('id').inTable('user').onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals')
}
