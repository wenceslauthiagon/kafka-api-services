'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      //Add Column
      await queryInterface.addColumn(
        'warning_transactions',
        'reason',
        {
          field: 'reason',
          type: Sequelize.TEXT,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'warning_transactions',
        'analysis_details',
        {
          field: 'analysis_details',
          type: Sequelize.TEXT,
          allowNull: true,
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
      await queryInterface.removeColumn('warning_transactions', 'reason', {
        transaction,
      });

      await queryInterface.removeColumn(
        'warning_transactions',
        'analysis_details',
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
