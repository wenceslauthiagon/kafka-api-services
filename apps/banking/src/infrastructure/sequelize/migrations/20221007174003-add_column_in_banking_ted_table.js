'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'BankingTeds',
        'user_id',
        { type: Sequelize.UUID },
        { transaction },
      );

      await queryInterface.addColumn(
        'BankingTeds',
        'state',
        { type: Sequelize.STRING },
        { transaction },
      );

      await queryInterface.addColumn(
        'BankingTeds',
        'amount',
        { type: Sequelize.BIGINT },
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
      await queryInterface.removeColumn('BankingTeds', 'user_id', {
        transaction,
      });
      await queryInterface.removeColumn('BankingTeds', 'state', {
        transaction,
      });
      await queryInterface.removeColumn('BankingTeds', 'amount', {
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
