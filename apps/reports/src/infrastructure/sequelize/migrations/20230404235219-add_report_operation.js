'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'report_operations',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          operationId: {
            field: 'operation_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          operationDate: {
            field: 'operation_date',
            type: Sequelize.DATE,
            allowNull: false,
          },
          operationValue: {
            field: 'operation_value',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          operationType: {
            field: 'operation_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          transactionTypeId: {
            field: 'transaction_type_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          transactionTypeTitle: {
            field: 'transaction_type_title',
            type: Sequelize.STRING,
            allowNull: false,
          },
          transactionTypeTag: {
            field: 'transaction_type_tag',
            type: Sequelize.STRING,
            allowNull: false,
          },
          beneficiaryName: {
            field: 'beneficiary_name',
            type: Sequelize.STRING,
          },
          beneficiaryDocument: {
            field: 'beneficiary_document',
            type: Sequelize.STRING,
            allowNull: false,
          },
          beneficiaryDocumentType: {
            field: 'beneficiary_document_type',
            type: Sequelize.STRING,
          },
          beneficiaryBankCode: {
            field: 'beneficiary_bank_code',
            type: Sequelize.STRING,
            allowNull: false,
          },
          beneficiaryBranch: {
            field: 'beneficiary_branch',
            type: Sequelize.STRING,
            allowNull: false,
          },
          beneficiaryAccountNumber: {
            field: 'beneficiary_account_number',
            type: Sequelize.STRING,
            allowNull: false,
          },
          ownerId: {
            field: 'owner_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          ownerName: {
            field: 'owner_name',
            type: Sequelize.STRING,
          },
          ownerDocument: {
            field: 'owner_document',
            type: Sequelize.STRING,
            allowNull: false,
          },
          ownerDocumentType: {
            field: 'owner_document_type',
            type: Sequelize.STRING,
          },
          ownerBankCode: {
            field: 'owner_bank_code',
            type: Sequelize.STRING,
            allowNull: false,
          },
          ownerBranch: {
            field: 'owner_branch',
            type: Sequelize.STRING,
            allowNull: false,
          },
          ownerAccountNumber: {
            field: 'owner_account_number',
            type: Sequelize.STRING,
            allowNull: false,
          },
          currencySymbol: {
            field: 'currency_symbol',
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
      await queryInterface.dropTable('report_operations', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
