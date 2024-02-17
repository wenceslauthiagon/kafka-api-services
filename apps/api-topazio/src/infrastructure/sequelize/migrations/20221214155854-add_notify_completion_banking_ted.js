'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'topazio_notify_completion_banking_teds',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          transactionId: {
            field: 'transaction_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          state: {
            field: 'state',
            type: Sequelize.STRING,
            allowNull: false,
          },
          document: {
            field: 'document',
            type: Sequelize.STRING,
            allowNull: false,
          },
          bankCode: {
            field: 'bank_code',
            type: Sequelize.STRING,
            allowNull: false,
          },
          branch: {
            field: 'branch',
            type: Sequelize.STRING,
            allowNull: false,
          },
          accountNumber: {
            field: 'account_number',
            type: Sequelize.STRING,
            allowNull: false,
          },
          accountType: {
            field: 'account_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          value: {
            field: 'value',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          createdAt: {
            field: 'created_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          updatedAt: {
            field: 'updated_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('topazio_notify_completion_banking_teds', {
        transaction,
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
