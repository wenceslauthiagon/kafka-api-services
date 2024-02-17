'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'agent_ispb_withdrawal',
        {
          field: 'agent_ispb_withdrawal',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'agent_mod_withdrawal',
        {
          field: 'agent_mod_withdrawal',
          type: Sequelize.STRING,
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'agent_ispb_withdrawal',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'agent_mod_withdrawal',
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
