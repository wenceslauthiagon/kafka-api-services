'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'pix_refunds',
        'refund_devolution_id',
        {
          field: 'refund_devolution_id',
          type: Sequelize.UUID,
        },
        { transaction },
      );

      await queryInterface.removeColumn('pix_refunds', 'summary', {
        transaction,
      });
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
      await queryInterface.removeColumn('pix_refunds', 'refund_devolution_id', {
        transaction,
      });

      await queryInterface.addColumn(
        'pix_refunds',
        'summary',
        {
          field: 'summary',
          type: Sequelize.TEXT,
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
};
