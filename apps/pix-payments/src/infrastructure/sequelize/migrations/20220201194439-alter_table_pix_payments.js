'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      //Add Columns

      await queryInterface.addColumn(
        'pix_payments',
        'owner_account_number',
        {
          field: 'owner_account_number',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_payments',
        'owner_branch',
        {
          field: 'owner_branch',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_payments',
        'owner_document',
        {
          field: 'owner_document',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_payments',
        'owner_full_name',
        {
          field: 'owner_full_name',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_payments',
        'key',
        {
          field: 'key',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_payments',
        'txid',
        {
          field: 'txid',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      //Rename Columns

      await queryInterface.renameColumn(
        'pix_payments',
        'account_type',
        'beneficiary_account_type',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'person_type',
        'beneficiary_person_type',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'branch',
        'beneficiary_branch',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'account_number',
        'beneficiary_account_number',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'bank_name',
        'beneficiary_bank_name',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'bank_code',
        'beneficiary_bank_code',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'document',
        'beneficiary_document',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'name',
        'beneficiary_name',
        { transaction },
      );

      //Change type operationId for UUID USING CAST
      await queryInterface.sequelize.query(
        'ALTER TABLE pix_payments ALTER COLUMN operation_id TYPE uuid USING operation_id::uuid',
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
      await queryInterface.removeColumn(
        'pix_payments',
        'owner_account_number',
        { transaction },
      );
      await queryInterface.removeColumn('pix_payments', 'owner_branch', {
        transaction,
      });
      await queryInterface.removeColumn('pix_payments', 'owner_document', {
        transaction,
      });
      await queryInterface.removeColumn('pix_payments', 'owner_full_name', {
        transaction,
      });
      await queryInterface.removeColumn('pix_payments', 'key', { transaction });
      await queryInterface.removeColumn('pix_payments', 'txid', {
        transaction,
      });
      await queryInterface.renameColumn(
        'pix_payments',
        'beneficiary_account_type',
        'account_type',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'beneficiary_person_type',
        'person_type',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'beneficiary_branch',
        'branch',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'beneficiary_account_number',
        'account_number',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'beneficiary_bank_name',
        'bank_name',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'beneficiary_bank_code',
        'bank_code',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'beneficiary_document',
        'document',
        { transaction },
      );

      await queryInterface.renameColumn(
        'pix_payments',
        'beneficiary_name',
        'name',
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
