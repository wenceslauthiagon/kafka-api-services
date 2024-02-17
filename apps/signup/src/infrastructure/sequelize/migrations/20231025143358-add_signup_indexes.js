'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'signup',
        },
        ['phone_number'],
        {
          transaction,
          name: 'signup_phone_number_key',
        },
      );

      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'signup',
        },
        ['state', 'created_at'],
        {
          transaction,
          name: 'signup_state_created_at_key',
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
          tableName: 'signup',
        },
        'signup_phone_number_key',
        { transaction },
      );

      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'signup',
        },
        'signup_state_created_at_key',
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
