'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'pix_qr_code_dynamic',
        'key',
        { type: Sequelize.STRING, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_qr_code_dynamic',
        'key_type',
        { type: Sequelize.STRING, allowNull: true },
        { transaction },
      );

      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'pix_qr_code_dynamic',
        },
        ['txid'],
        { transaction, name: 'pix_qr_code_dynamic_txid_key' },
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
      await queryInterface.removeColumn('pix_qr_code_dynamic', 'key', {
        transaction,
      });

      await queryInterface.removeColumn('pix_qr_code_dynamic', 'key_type', {
        transaction,
      });

      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'pix_qr_code_dynamic',
        },
        'pix_qr_code_dynamic_txid_key',
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
