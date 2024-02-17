'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add requested_raw_value column
      await queryInterface.addColumn(
        'Operations',
        'owner_requested_raw_value',
        {
          field: 'owner_requested_raw_value',
          type: Sequelize.BIGINT,
        },
        { transaction },
      );
      // Add requested_fee column
      await queryInterface.addColumn(
        'Operations',
        'owner_requested_fee',
        {
          field: 'owner_requested_fee',
          type: Sequelize.BIGINT,
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
      await queryInterface.removeColumn(
        'Operations',
        'owner_requested_raw_value',
        { transaction },
      );
      await queryInterface.removeColumn('Operations', 'owner_requested_fee', {
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
