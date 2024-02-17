'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_statements',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          transactionId: {
            field: 'transaction_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          transactionType: {
            field: 'transaction_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          transactionState: {
            field: 'transaction_state',
            type: Sequelize.STRING,
            allowNull: false,
          },
          transactionDate: {
            field: 'transaction_date',
            type: Sequelize.DATE,
            allowNull: false,
          },
          operationId: {
            field: 'operation_id',
            type: Sequelize.UUID,
          },
          amount: {
            field: 'amount',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          changeAmount: {
            field: 'change_amount',
            type: Sequelize.BIGINT,
          },
          purchaseChangeAmount: {
            field: 'purchase_change_amount',
            type: Sequelize.BIGINT,
          },
          ownerName: {
            field: 'owner_name',
            type: Sequelize.STRING,
            allowNull: false,
          },
          beneficiaryName: {
            field: 'beneficiary_name',
            type: Sequelize.STRING,
            allowNull: false,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
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
          deletedAt: {
            field: 'deleted_at',
            type: Sequelize.DATE,
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
      await queryInterface.dropTable('pix_statements', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
