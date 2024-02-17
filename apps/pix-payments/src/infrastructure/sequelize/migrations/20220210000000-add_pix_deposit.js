'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_deposits',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          operationId: {
            field: 'operation_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          txId: {
            field: 'txid',
            type: Sequelize.STRING,
          },
          transactionId: {
            field: 'transaction_id',
            type: Sequelize.STRING,
          },
          endToEndId: {
            field: 'end_to_end_id',
            type: Sequelize.STRING,
          },
          amount: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          clientBankIspb: {
            field: 'client_bank_ispb',
            type: Sequelize.STRING,
          },
          clientBankName: {
            field: 'client_bank_name',
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
          thirdPartBankIspb: {
            field: 'third_part_bank_ispb',
            type: Sequelize.STRING,
          },
          thirdPartBankName: {
            field: 'third_part_bank_name',
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
      await queryInterface.dropTable('pix_deposits', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
