module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.addColumn(
          'spreads',
          'off_market_buy',
          { type: Sequelize.INTEGER, defaultValue: 0 },
          { transaction },
        ),
        await queryInterface.addColumn(
          'spreads',
          'off_market_sell',
          { type: Sequelize.INTEGER, defaultValue: 0 },
          { transaction },
        ),
        await queryInterface.addColumn(
          'spreads',
          'off_market_time_start',
          { type: Sequelize.STRING },
          { transaction },
        ),
        await queryInterface.addColumn(
          'spreads',
          'off_market_time_end',
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
        queryInterface.removeColumn('spreads', 'off_market_buy', {
          transaction,
        }),
        queryInterface.removeColumn('spreads', 'off_market_sell', {
          transaction,
        }),
        queryInterface.removeColumn('spreads', 'off_market_time_start', {
          transaction,
        }),
        await queryInterface.removeColumn('spreads', 'off_market_time_end', {
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
