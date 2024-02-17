'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'webhooks',
        },
        ['account_number', 'agency_number', 'state', 'type'],
        {
          transaction,
          name: 'webhooks_account_number_agency_number_state_type_key',
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'webhooks',
        },
        'webhooks_account_number_agency_number_state_type_key',
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
