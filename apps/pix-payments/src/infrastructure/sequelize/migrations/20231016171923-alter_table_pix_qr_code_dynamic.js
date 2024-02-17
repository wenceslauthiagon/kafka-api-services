'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'pix_qr_code_dynamic',
        'payload_jws',
        { type: Sequelize.TEXT },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_qr_code_dynamic',
        'external_id',
        { type: Sequelize.UUID },
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
      await queryInterface.removeColumn('pix_qr_code_dynamic', 'payload_jws', {
        transaction,
      });

      await queryInterface.removeColumn('pix_qr_code_dynamic', 'external_id', {
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
