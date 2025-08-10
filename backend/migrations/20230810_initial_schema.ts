import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema
      // Roles table - stores roles and their permissions as JSON
      .createTable('roles', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable().unique();
        table.jsonb('permissions').notNullable().defaultTo('[]');
      })

      // Users table
      .createTable('users', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('email').unique().notNullable();
        table.string('mobile_no').notNullable();
        table.string('password_hash').notNullable();
        table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('SET NULL');
        table.jsonb('extra_permissions').defaultTo('[]');
        table.timestamps(true, true);
      })


      // Blocks table
      .createTable('blocks', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.text('description');
        table.string('image_url');
        table.timestamps(true, true);
      })

      // Rooms table
      .createTable('rooms', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.text('description');
        table.integer('incharge_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
        table.integer('block_id').unsigned().notNullable().references('id').inTable('blocks').onDelete('CASCADE');
        table.integer('floor');
        table.timestamps(true, true);
      })

      // Systems table
      .createTable('systems', (table) => {
        table.string('disk_serial_no').primary();
        table.integer('room_id').unsigned().nullable().references('id').inTable('rooms').onDelete('SET NULL');
        table.enu('type', ['spare', 'using']).notNullable().defaultTo('using');
        table.enu('status', ['green', 'orange', 'red']).notNullable().defaultTo('green');
        table.specificType('faulty_parts', 'text[]').defaultTo('{}');
        table.float('upload_speed_mbps');
        table.float('download_speed_mbps');
        table.float('ping_ms');
        table.timestamp('last_reported_at').defaultTo(knex.fn.now());
        table.timestamps(true, true);
      })

      // Faults table
      .createTable('faults', (table) => {
        table.increments('id').primary();
        table.string('system_disk_serial_no').notNullable().references('disk_serial_no').inTable('systems').onDelete('CASCADE');
        table.string('fault_type').notNullable();
        table.text('description');
        table.integer('reported_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
        table.timestamp('reported_at').defaultTo(knex.fn.now());
        table.enu('status', ['pending', 'in_progress', 'resolved']).notNullable().defaultTo('pending');
        table.integer('technician_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
        table.timestamp('resolved_at').nullable();
        table.timestamps(true, true);
      });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
      .dropTableIfExists('faults')
      .dropTableIfExists('systems')
      .dropTableIfExists('rooms')
      .dropTableIfExists('blocks')
      .dropTableIfExists('users')
      .dropTableIfExists('roles')
      .dropTableIfExists('levels');
}
