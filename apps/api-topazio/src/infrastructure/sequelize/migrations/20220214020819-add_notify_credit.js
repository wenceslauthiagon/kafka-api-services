'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'topazio_notify_credits',
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
          transactionType: {
            field: 'transaction_type',
            type: Sequelize.STRING,
          },
          isDevolution: {
            field: 'is_devolution',
            type: Sequelize.BOOLEAN,
          },
          operation: {
            field: 'operation',
            type: Sequelize.STRING,
          },
          status: {
            field: 'status',
            type: Sequelize.STRING,
          },
          statusMessage: {
            field: 'status_message',
            type: Sequelize.STRING,
          },
          transactionOriginalID: {
            field: 'transaction_original_id',
            type: Sequelize.STRING,
          },
          reason: {
            field: 'reason',
            type: Sequelize.STRING,
          },
          txId: {
            field: 'txid',
            type: Sequelize.STRING,
          },
          amount: {
            field: 'amount',
            type: Sequelize.BIGINT,
          },
          clientIspb: {
            field: 'client_ispb',
            type: Sequelize.STRING,
          },
          clientBranch: {
            field: 'client_branch',
            type: Sequelize.STRING,
          },
          clientAccountNumber: {
            field: 'client_account_number',
            type: Sequelize.STRING,
          },
          clientDocument: {
            field: 'client_document',
            type: Sequelize.STRING,
          },
          clientName: {
            field: 'client_name',
            type: Sequelize.STRING,
          },
          clientKey: {
            field: 'client_key',
            type: Sequelize.STRING,
          },
          thirdPartIspb: {
            field: 'third_part_ispb',
            type: Sequelize.STRING,
          },
          thirdPartBranch: {
            field: 'third_part_branch',
            type: Sequelize.STRING,
          },
          thirdPartAccountType: {
            field: 'third_part_account_type',
            type: Sequelize.STRING,
          },
          thirdPartAccountNumber: {
            field: 'third_part_account_number',
            type: Sequelize.STRING,
          },
          thirdPartDocument: {
            field: 'third_part_document',
            type: Sequelize.STRING,
          },
          thirdPartName: {
            field: 'third_part_name',
            type: Sequelize.STRING,
          },
          thirdPartKey: {
            field: 'third_part_key',
            type: Sequelize.STRING,
          },
          endToEndId: {
            field: 'end_to_end_id',
            type: Sequelize.STRING,
          },
          description: {
            field: 'description',
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
      await queryInterface.dropTable('topazio_notify_credits', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
