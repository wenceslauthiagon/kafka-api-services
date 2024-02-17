'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('pix_decoded_qr_code', 'access_token', {
        transaction,
      });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'access_token',
        { type: Sequelize.STRING },
        { transaction },
      );
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
