'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'report_operations',
        },
        ['operation_id'],
        {
          transaction,
          name: 'report_operations_operation_id_key',
        },
      );

      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'report_operations',
        },
        ['operation_id', 'client_account_number', 'operation_type'],
        {
          transaction,
          name: 'report_operations_operation_id_client_account_number_operation_type_key',
        },
      );

      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'report_users_legal_representor',
        },
        ['user_legal_representor_id'],
        {
          transaction,
          name: 'report_users_legal_representor_user_legal_representor_id_key',
        },
      );

      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'report_users',
        },
        ['user_id'],
        {
          transaction,
          name: 'report_users_user_id_key',
        },
      );

      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'report_users',
        },
        ['type'],
        {
          transaction,
          name: 'report_users_type_key',
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
          tableName: 'report_operations',
        },
        'report_operations_operation_id_key',
        { transaction },
      );

      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'report_operations',
        },
        'report_operations_operation_id_client_account_number_operation_type_key',
        { transaction },
      );

      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'report_users_legal_representor',
        },
        'report_users_legal_representor_user_legal_representor_id_key',
        { transaction },
      );

      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'report_users',
        },
        'report_users_user_id_key',
        { transaction },
      );

      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'report_users',
        },
        'report_users_type_key',
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
