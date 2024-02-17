const options = {
  port: process.env.APP_DATABASE_PORT,
  schema: process.env.APP_DATABASE_SCHEMA,
  password: process.env.APP_DATABASE_PASSWORD,
  dialect: 'postgres',
  migrationStorageTableName: process.env.APP_DATABASE_MIGRATION_TABLE,
  seederStorageTableName: process.env.APP_DATABASE_SEEDERS_TABLE,
  logging: process.env.APP_DATABASE_DEBUG === 'true',
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
      username: process.env.APP_DATABASE_USERNAME,
      password: process.env.APP_DATABASE_PASSWORD,
    },
    read: process.env.APP_DATABASE_READ_HOST.split(' ').map((item) => {
      return {
        host: item,
        username: process.env.APP_DATABASE_USERNAME,
        password: process.env.APP_DATABASE_PASSWORD,
      };
    }),
  };
} else {
  options.host = process.env.APP_DATABASE_HOST;
  options.database = process.env.APP_DATABASE_DATABASE;
  options.username = process.env.APP_DATABASE_USERNAME;
}

module.exports = options;
