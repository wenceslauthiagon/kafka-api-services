'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      //Add Columns

      // Decoded pix key
      await queryInterface.addColumn(
        'pix_payments',
        'decoded_pix_key_id',
        {
          field: 'decoded_pix_key_id',
          type: Sequelize.UUID,
        },
        { transaction },
      );

      // Beneficiary Ispb
      await queryInterface.renameColumn(
        'pix_payments',
        'beneficiary_bank_code',
        'beneficiary_bank_ispb',
        {
          transaction,
        },
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
      await queryInterface.removeColumn('pix_payments', 'decoded_pix_key_id', {
        transaction,
      });
      await queryInterface.renameColumn(
        'pix_payments',
        'beneficiary_bank_ispb',
        'beneficiary_bank_code',
        {
          transaction,
        },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
