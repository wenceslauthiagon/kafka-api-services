'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'topazio_failed_notify_credits',
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
          failed_code: {
            field: 'failed_code',
            type: Sequelize.STRING,
          },
          failed_message: {
            field: 'failed_message',
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
      await queryInterface.dropTable('topazio_failed_notify_credits', {
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
