'use strict';

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'topazio_notify_confirm_banking_teds',
      },
      ['transaction_id'],
      {
        name: 'topazio_notify_confirm_banking_teds_transaction_id_key',
        transaction,
      },
    );

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'topazio_notify_register_banking_teds',
      },
      ['transaction_id'],
      {
        name: 'topazio_notify_register_banking_teds_transaction_id_key',
        transaction,
      },
    );
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'topazio_notify_confirm_banking_teds',
      },
      ['transaction_id'],
      {
        name: 'topazio_notify_confirm_banking_teds_transaction_id_key',
        transaction,
      },
    );

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'topazio_notify_register_banking_teds',
      },
      ['transaction_id'],
      {
        name: 'topazio_notify_register_banking_teds_transaction_id_key',
        transaction,
      },
    );
  },
};
