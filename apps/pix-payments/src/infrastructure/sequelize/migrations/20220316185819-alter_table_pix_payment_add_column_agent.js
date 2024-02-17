'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Agent mod
      await queryInterface.addColumn(
        'pix_payments',
        'agent_mod',
        {
          field: 'agent_mod',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      // Agent ispb
      await queryInterface.addColumn(
        'pix_payments',
        'agent_ispb',
        {
          field: 'agent_ispb',
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

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('pix_payments', 'agent_mod', {
        transaction,
      });
      await queryInterface.removeColumn('pix_payments', 'agent_ispb', {
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
