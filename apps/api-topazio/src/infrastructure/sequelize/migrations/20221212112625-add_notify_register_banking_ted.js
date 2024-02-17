'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'topazio_notify_register_banking_teds',
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
          status: {
            field: 'status',
            type: Sequelize.STRING,
            allowNull: false,
          },
          state: {
            field: 'state',
            type: Sequelize.STRING,
            allowNull: false,
          },
          code: {
            field: 'code',
            type: Sequelize.STRING,
          },
          message: {
            field: 'message',
            type: Sequelize.STRING,
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
      await queryInterface.dropTable('topazio_notify_register_banking_teds', {
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
