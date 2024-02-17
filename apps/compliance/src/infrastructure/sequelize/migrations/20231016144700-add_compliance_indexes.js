'use strict';

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'user_limit_requests',
      },
      ['user_id'],
      {
        name: 'user_limit_requests_user_id_key',
        transaction,
      },
    );

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'warning_transactions',
      },
      ['operation_id'],
      {
        name: 'warning_transactions_operation_id_key',
        transaction,
      },
    );

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'users_withdraws_settings_requests',
      },
      ['user_id'],
      {
        name: 'users_withdraws_settings_requests_user_id_key',
        transaction,
      },
    );
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'user_limit_requests',
      },
      ['user_id'],
      {
        name: 'user_limit_requests_user_id_key',
        transaction,
      },
    );

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'warning_transactions',
      },
      ['operation_id'],
      {
        name: 'warning_transactions_operation_id_key',
        transaction,
      },
    );

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'users_withdraws_settings_requests',
      },
      ['user_id'],
      {
        name: 'users_withdraws_settings_requests_user_id_key',
        transaction,
      },
    );
  },
};
