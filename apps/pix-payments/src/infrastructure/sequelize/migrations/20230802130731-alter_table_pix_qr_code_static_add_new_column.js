'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'pix_qr_code_static',
        'recipient_name',
        { type: Sequelize.STRING, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_qr_code_static',
        'ispb_withdrawal',
        { type: Sequelize.STRING, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_qr_code_static',
        'expiration_date',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_qr_code_static',
        'paid_times',
        { type: Sequelize.INTEGER, defaultValue: 0 },
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
        'pix_qr_code_static',
        'recipient_name',
        { transaction },
      );

      await queryInterface.removeColumn(
        'pix_qr_code_static',
        'ispb_withdrawal',
        { transaction },
      );

      await queryInterface.removeColumn(
        'pix_qr_code_static',
        'expiration_date',
        { transaction },
      );

      await queryInterface.removeColumn('pix_qr_code_static', 'paid_times', {
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
