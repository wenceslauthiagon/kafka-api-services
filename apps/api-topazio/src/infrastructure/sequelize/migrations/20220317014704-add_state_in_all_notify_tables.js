'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await Promise.all([
        queryInterface.addColumn(
          'topazio_notify_claims',
          'state',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'topazio_notify_completions',
          'state',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'topazio_notify_credits',
          'state',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'topazio_notify_debits',
          'state',
          { type: Sequelize.STRING },
          { transaction },
        ),
      ]);
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
      await Promise.all([
        queryInterface.removeColumn('topazio_notify_claims', 'state', {
          transaction,
        }),
        queryInterface.removeColumn('topazio_notify_completions', 'state', {
          transaction,
        }),
        queryInterface.removeColumn('topazio_notify_credits', 'state', {
          transaction,
        }),
        queryInterface.removeColumn('topazio_notify_debits', 'state', {
          transaction,
        }),
      ]);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
