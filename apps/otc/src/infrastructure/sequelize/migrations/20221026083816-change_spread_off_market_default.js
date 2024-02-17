'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.changeColumn(
        'spreads',
        'off_market_buy',
        { type: Sequelize.INTEGER, defaultValue: null, allowNull: true },
        { transaction },
      );
      await queryInterface.changeColumn(
        'spreads',
        'off_market_sell',
        { type: Sequelize.INTEGER, defaultValue: null, allowNull: true },
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
      await queryInterface.changeColumn(
        'spreads',
        'off_market_buy',
        { type: Sequelize.INTEGER, defaultValue: 0 },
        { transaction },
      );
      await queryInterface.changeColumn(
        'spreads',
        'off_market_sell',
        { type: Sequelize.INTEGER, defaultValue: 0 },
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
