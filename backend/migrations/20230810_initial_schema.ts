import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('permissions', (table) => {
        table.string('name').notNullable().primary();
        table.text('description').nullable();
        table.timestamps(true, true);
    })      // Users table
        .createTable('users', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.string('email').unique().notNullable();
            table.string('mobile_no').notNullable();
            table.string('password_hash').notNullable();
            table.jsonb('permissions').defaultTo('[]');
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
            table.float('upload_speed_mbps');
            table.float('download_speed_mbps');
            table.float('ping_ms');
            table.timestamp('last_reported_at').defaultTo(knex.fn.now());
            table.timestamps(true, true);
        })
        .createTable('faults', (table) => {
            table.string('name').notNullable().primary();
            table.text('description').nullable();
            table.timestamps(true, true);
        })

        // Faults table
        .createTable('fault_reports', (table) => {
            table.increments('id').primary();
            table.string('system_disk_serial_no').notNullable().references('disk_serial_no').inTable('systems').onDelete('CASCADE');
            table.string('fault_name').notNullable().references('name').inTable('faults').onDelete('CASCADE');
            table.text('description');
            table.integer('reported_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
            table.timestamp('reported_at').defaultTo(knex.fn.now());
            table.enu('status', ['pending', 'in_progress', 'resolved']).notNullable().defaultTo('pending');
            table.integer('technician_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
            table.timestamp('resolved_at').nullable();
            table.timestamps(true, true);
        }).then(async () => {
            //Add default permissions
            await knex.table('faults').insert([
                {name: "monitor_issue", description: "Monitor Related issue"},
                {name: "keyboard_issue", description: "Keyboard Related issue"},
                {name: "mouse_issue", description: "Mouse Related issue"},
                {name: "printer_issue", description: "Printer Related issue"},
                {name: "speaker_issue", description: "Speaker Related issue"},
                {name: "other_peripheral_issue", description: "Other Peripheral issue"},
                {name: 'other_hardware_issue', description: 'Other Hardware issue'},
                {name: 'other_software_issue', description: 'Other Software issue'},
                {name: 'network_issue', description: 'Network issue'},
                {name: 'other_issue', description: 'Other issue not covered above'},
                {name: 'system_not_working', description: 'System not working'},
                {name: 'system_not_booting', description: 'System not booting'},
            ]);

           await knex('permissions').insert([
                {name: 'view_users', description: 'Permission to view users'},
                {name: 'edit_users', description: 'Permission to edit users'},
                {name: 'delete_users', description: 'Permission to delete users'},
                {name: 'edit_roles', description: 'Permission to edit roles'},
                {name: 'edit_systems', description: 'Permission to edit systems'},
                {name: 'delete_systems', description: 'Permission to delete systems'},
                {name: 'view_faults', description: 'Permission to view faults'},
                {name: 'edit_faults', description: 'Permission to edit faults'},
                {name: 'delete_faults', description: 'Permission to delete faults'},
                {name: '*', description: 'All permissions, use with caution'},
                {
                    name: 'grant_permissions',
                    description: 'Permission to grant permissions to users except self and wildcard (*)'
                },
            ]);
        })
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema
        .dropTableIfExists('faults')
        .dropTableIfExists('fault_reports')
        .dropTableIfExists('systems')
        .dropTableIfExists('rooms')
        .dropTableIfExists('blocks')
        .dropTableIfExists('users')
        .dropTableIfExists('levels')
        .dropTableIfExists('permissions');
}
