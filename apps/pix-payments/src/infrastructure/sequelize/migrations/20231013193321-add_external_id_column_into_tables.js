'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'pix_payments',
        'external_id',
        { type: Sequelize.UUID },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_devolutions',
        'external_id',
        { type: Sequelize.UUID },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_refund_devolutions',
        'external_id',
        { type: Sequelize.UUID },
        { transaction },
      );

      await queryInterface.addColumn(
        'warning_pix_devolutions',
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
      await queryInterface.removeColumn('pix_payments', 'external_id', {
        transaction,
      });

      await queryInterface.removeColumn('pix_devolutions', 'external_id', {
        transaction,
      });

      await queryInterface.removeColumn(
        'pix_refund_devolutions',
        'external_id',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'warning_pix_devolutions',
        'external_id',
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
