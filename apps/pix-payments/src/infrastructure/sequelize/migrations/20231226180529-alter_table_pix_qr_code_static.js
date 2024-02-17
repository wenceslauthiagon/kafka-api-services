'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.changeColumn(
        'pix_qr_code_static',
        'paid_times',
        { type: Sequelize.INTEGER, defaultValue: null, allowNull: true },
        { transaction },
      );

      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'pix_qr_code_static',
        },
        ['txid'],
        {
          transaction,
          name: 'pix_qr_code_static_txid_key',
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.changeColumn(
        'pix_qr_code_static',
        'paid_times',
        { type: Sequelize.INTEGER, defaultValue: 0 },
        { transaction },
      );

      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'pix_qr_code_static',
        },
        'pix_qr_code_static_txid_key',
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
