'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'feature_settings',
        },
        ['name'],
        {
          transaction,
          name: 'feature_settings_name_key',
        },
      );

      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'users_withdraws_settings',
        },
        ['id', 'user_id'],
        {
          transaction,
          name: 'users_withdraws_settings_id_user_id_key',
        },
      );

      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'users_withdraws_settings',
        },
        ['state', 'type', 'day', 'week_day'],
        {
          transaction,
          name: 'users_withdraws_settings_state_type_day_week_day_key',
        },
      );

      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'users_withdraws_settings',
        },
        ['wallet_id'],
        {
          transaction,
          name: 'users_withdraws_settings_wallet_id_key',
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
          tableName: 'feature_settings',
        },
        'feature_settings_name_key',
        { transaction },
      );

      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'users_withdraws_settings',
        },
        'users_withdraws_settings_id_user_id_key',
        { transaction },
      );

      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'users_withdraws_settings',
        },
        'users_withdraws_settings_state_type_day_week_day_key',
        { transaction },
      );

      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'users_withdraws_settings',
        },
        'users_withdraws_settings_wallet_id_key',
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
