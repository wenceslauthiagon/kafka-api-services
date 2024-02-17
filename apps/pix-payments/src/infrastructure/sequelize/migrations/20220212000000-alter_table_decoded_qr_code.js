'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      //Alter type value to bigint
      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'payment_value',
        { type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'deduction_value',
        { type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'original_value',
        { type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'discount_value',
        { type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'fine_value',
        { type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'interest_value',
        { type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'document_value',
        { type: Sequelize.BIGINT },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'payment_value',
        { type: Sequelize.FLOAT },
        { transaction },
      );
      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'deduction_value',
        { type: Sequelize.FLOAT },
        { transaction },
      );
      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'original_value',
        { type: Sequelize.FLOAT },
        { transaction },
      );
      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'discount_value',
        { type: Sequelize.FLOAT },
        { transaction },
      );
      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'fine_value',
        { type: Sequelize.FLOAT },
        { transaction },
      );
      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'interest_value',
        { type: Sequelize.FLOAT },
        { transaction },
      );
      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'document_value',
        { type: Sequelize.FLOAT },
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
