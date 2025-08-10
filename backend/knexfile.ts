import type {Knex} from 'knex';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable');
}

const config: { [key: string]: Knex.Config } = {
    test: {
        client: 'pg',
        connection: connectionString,
        migrations: {
            directory: './migrations',
        },
        pool: {
            min: 2,
            max: 10,
        },
    },
    development: {
        client: 'pg',
        connection: connectionString,
        migrations: {
            directory: './migrations',
        },
        pool: {
            min: 2,
            max: 10,
        },
    },

    production: {
        client: 'pg',
        connection: connectionString,
        migrations: {
            directory: './migrations',
        },
        pool: {
            min: 2,
            max: 10,
        },
    },
};

export default config;
