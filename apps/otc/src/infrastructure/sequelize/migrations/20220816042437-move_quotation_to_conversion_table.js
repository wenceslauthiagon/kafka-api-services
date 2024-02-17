'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Conversions',
        'quotation_id',
        {
          type: Sequelize.UUID,
        },
        { transaction },
      );

      await queryInterface.removeColumn('crypto_orders', 'quotation_id', {
        transaction,
      });
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
      await queryInterface.addColumn(
        'crypto_orders',
        'quotation_id',
        {
          type: Sequelize.UUID,
        },
        { transaction },
      );

      await queryInterface.removeColumn('Conversions', 'quotation_id', {
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
