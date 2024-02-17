require('dotenv').config();

const options = {
  port: process.env.APP_DATABASE_PORT,
  schema: process.env.APP_DATABASE_SCHEMA,
  database: process.env.APP_DATABASE_DATABASE,
  dialect: 'postgres',
  migrationStorageTableName: process.env.APP_DATABASE_MIGRATION_TABLE,
  seederStorageTableName: process.env.APP_DATABASE_SEEDERS_TABLE,
  logging: process.env.APP_DATABASE_LOG === 'true',
  dialectOptions: {
    ssl:
      process.env.APP_DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
  },
};

if (process.env.APP_DATABASE_WRITE_HOST && process.env.APP_DATABASE_READ_HOST) {
  options.replication = {
    write: {
      host: process.env.APP_DATABASE_WRITE_HOST,
      username: process.env.APP_DATABASE_MIGRATION_USERNAME,
      password: process.env.APP_DATABASE_MIGRATION_PASSWORD,
    },
    read: process.env.APP_DATABASE_READ_HOST.split(' ').map((host) => {
      return {
        host,
        username: process.env.APP_DATABASE_MIGRATION_USERNAME,
        password: process.env.APP_DATABASE_MIGRATION_PASSWORD,
      };
    }),
  };
} else {
  options.host = process.env.APP_DATABASE_HOST;
  options.password = process.env.APP_DATABASE_MIGRATION_PASSWORD;
  options.username = process.env.APP_DATABASE_MIGRATION_USERNAME;
}

module.exports = options;
