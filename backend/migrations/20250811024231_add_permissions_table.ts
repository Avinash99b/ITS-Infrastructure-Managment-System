import type {Knex} from "knex";


export async function up(knex: Knex): Promise<void> {
    knex.schema.createTable('permissions', (table) => {
        table.string('name').notNullable().primary();
        table.text('description').nullable();
        table.timestamps(true, true);
    })

        .then(() => {
            //Add default permissions
            return knex('permissions').insert([
                {name: 'view_users', description: 'Permission to view users'},
                {name: 'edit_users', description: 'Permission to edit users'},
                {name: 'delete_users', description: 'Permission to delete users'},
                {name: 'edit_roles', description: 'Permission to edit roles'},
                {name: 'delete_roles', description: 'Permission to delete roles'},
                {name: 'edit_systems', description: 'Permission to edit systems'},
                {name: 'delete_systems', description: 'Permission to delete systems'},
                {name: 'edit_faults', description: 'Permission to edit faults'},
                {name: 'delete_faults', description: 'Permission to delete faults'},
                {name: 'admin', description: 'Administrator permission, allows all actions'},
                {name: '*', description: 'All permissions, use with caution'},
                {name: 'grant_permissions', description: 'Permission to grant permissions to users except self and wildcard (*)'},
            ]);
        })
}


export async function down(knex: Knex): Promise<void> {
    knex.schema.dropTableIfExists('permissions')
}

