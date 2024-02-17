'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('quotations', 'provider_id', {
        transaction,
      });
      await queryInterface.addColumn(
        'quotations',
        'provider_name',
        {
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

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'quotations',
        'provider_id',
        {
          type: Sequelize.UUID,
        },
        { transaction },
      );
      await queryInterface.removeColumn('quotations', 'provider_name', {
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
