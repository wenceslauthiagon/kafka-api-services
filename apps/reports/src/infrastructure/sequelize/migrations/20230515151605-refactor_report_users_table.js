'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.renameColumn(
        'report_users',
        'user_full_name',
        'full_name',
        {
          transaction,
        },
      );
      await queryInterface.renameColumn(
        'report_users',
        'user_phone_number',
        'phone_number',
        {
          transaction,
        },
      );
      await queryInterface.renameColumn(
        'report_users',
        'user_document',
        'document',
        {
          transaction,
        },
      );
      await queryInterface.renameColumn('report_users', 'user_state', 'state', {
        transaction,
      });
      await queryInterface.renameColumn('report_users', 'user_email', 'email', {
        transaction,
      });
      await queryInterface.renameColumn(
        'report_users',
        'user_daily_limit',
        'daily_limit',
        {
          transaction,
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
      await queryInterface.renameColumn(
        'report_users',
        'full_name',
        'user_full_name',
        {
          transaction,
        },
      );
      await queryInterface.renameColumn(
        'report_users',
        'phone_number',
        'user_phone_number',
        {
          transaction,
        },
      );
      await queryInterface.renameColumn(
        'report_users',
        'document',
        'user_document',
        {
          transaction,
        },
      );
      await queryInterface.renameColumn('report_users', 'state', 'user_state', {
        transaction,
      });
      await queryInterface.renameColumn('report_users', 'email', 'user_email', {
        transaction,
      });
      await queryInterface.renameColumn(
        'report_users',
        'daily_limit',
        'user_daily_limit',
        {
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
