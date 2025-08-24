// mockData.js
import {Knex} from "knex";
import {faker} from '@faker-js/faker';
import bcrypt from "bcryptjs";

/**
 * Generate mock data for your DB schema
 */
exports.seed = async function (knex:Knex) {
    // Clear existing data
    await knex('fault_reports').del();
    await knex('systems').del();
    await knex('rooms').del();
    await knex('blocks').del();
    await knex('users').del();

    // Insert some users
    const users = [];
    for (let i = 0; i < 15; i++) {
        users.push({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            mobile_no: faker.number.int({ min: 6000000000, max: 9999999999 }).toString(),
            password_hash: await bcrypt.hash(faker.helpers.arrayElement([
                'Desktop@99',
                "Desktop@9502"
            ]),10), // mock hash
            permissions: JSON.stringify(
                faker.helpers.arrayElements(
                    [
                        'view_users',
                        'edit_users',
                        'delete_users',
                        'edit_systems',
                        'view_faults',
                        'edit_faults',
                        'grant_permissions',
                        'edit_rooms',
                        'edit_blocks'
                    ],
                    { min: 2, max: 6}
                )
            ),
            status: faker.helpers.arrayElement(['active', 'inactive', 'suspended']),
            created_at: faker.date.past(),
            updated_at: faker.date.recent(),
        });
    }
    const insertedUsers = await knex('users').insert(users).returning('*');

    // Insert some blocks
    const blocks = [];
    for (let i = 0; i < 5; i++) {
        blocks.push({
            name: `Block ${faker.word.noun()} ${i + 1}`,
            description: faker.lorem.sentence(),
            image_url: faker.image.url(),
            created_at: faker.date.past(),
            updated_at: faker.date.recent(),
        });
    }
    const insertedBlocks = await knex('blocks').insert(blocks).returning('*');

    // Insert some rooms
    const rooms = [];
    for (let i = 0; i < 20; i++) {
        rooms.push({
            name: `Room ${faker.string.alpha({ length: 2, casing: 'upper' })}-${i + 1}`,
            description: faker.lorem.sentence(),
            incharge_id: faker.helpers.arrayElement(insertedUsers).id,
            block_id: faker.helpers.arrayElement(insertedBlocks).id,
            floor: faker.number.int({ min: 0, max: 5 }),
            created_at: faker.date.past(),
            updated_at: faker.date.recent(),
        });
    }
    const insertedRooms = await knex('rooms').insert(rooms).returning('*');

    // Insert some systems
    const systems = [];
    for (let i = 0; i < 50; i++) {
        systems.push({
            disk_serial_no: faker.string.alphanumeric(12).toUpperCase(),
            room_id: faker.helpers.arrayElement(insertedRooms).id,
            type: faker.helpers.arrayElement(['spare', 'using']),
            status: faker.helpers.arrayElement(['green', 'orange', 'red']),
            upload_speed_mbps: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
            download_speed_mbps: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
            ping_ms: faker.number.float({ min: 1, max: 50, fractionDigits: 2 }),
            last_reported_at: faker.date.recent(),
            created_at: faker.date.past(),
            updated_at: faker.date.recent(),
        });
    }
    const insertedSystems = await knex('systems').insert(systems).returning('*');

    // Faults are already inserted in migration, so just fetch them
    const faults = await knex('faults').select('*');

    // Insert fault reports
    const faultReports = [];
    for (let i = 0; i < 30; i++) {
        const randomSystem = faker.helpers.arrayElement(insertedSystems);
        const randomFault = faker.helpers.arrayElement(faults);
        faultReports.push({
            system_disk_serial_no: randomSystem.disk_serial_no,
            fault_name: randomFault.name,
            description: faker.lorem.sentence(),
            reported_by: faker.helpers.arrayElement(insertedUsers).id,
            reported_at: faker.date.recent(),
            status: faker.helpers.arrayElement(['pending', 'in_progress', 'resolved']),
            technician_id: faker.helpers.arrayElement(insertedUsers).id,
            resolved_at: faker.helpers.maybe(() => faker.date.recent(), { probability: 0.5 }),
            created_at: faker.date.past(),
            updated_at: faker.date.recent(),
        });
    }
    await knex('fault_reports').insert(faultReports);

    console.log('✅ Mock data generated successfully');
};
