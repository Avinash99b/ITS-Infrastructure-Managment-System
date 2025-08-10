import knex, {Knex} from 'knex';
import config from '../../knexfile';

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment] as Knex.Config);

export default db;
