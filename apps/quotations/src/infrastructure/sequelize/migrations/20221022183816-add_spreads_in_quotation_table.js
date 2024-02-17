'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'quotations',
        'spread_buy',
        {
          type: Sequelize.INTEGER,
          defaultValue: null,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'quotations',
        'spread_sell',
        {
          type: Sequelize.INTEGER,
          defaultValue: null,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.renameColumn(
        'quotations',
        'spread_buy_amount',
        'spread_amount_buy',
        { transaction },
      );
      await queryInterface.renameColumn(
        'quotations',
        'spread_sell_amount',
        'spread_amount_sell',
        { transaction },
      );
      await queryInterface.renameColumn(
        'quotations',
        'spread_id',
        'spread_ids',
        { transaction },
      );
      await queryInterface.changeColumn(
        'quotations',
        'spread_ids',
        { type: Sequelize.STRING },
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
      await queryInterface.removeColumn('quotations', 'spread_buy', {
        transaction,
      });
      await queryInterface.removeColumn('quotations', 'spread_sell', {
        transaction,
      });

      await queryInterface.renameColumn(
        'quotations',
        'spread_amount_buy',
        'spread_buy_amount',
        { transaction },
      );
      await queryInterface.renameColumn(
        'quotations',
        'spread_amount_sell',
        'spread_sell_amount',
        { transaction },
      );
      await queryInterface.renameColumn(
        'quotations',
        'spread_ids',
        'spread_id',
        { transaction },
      );
      await queryInterface.changeColumn(
        'quotations',
        'spread_id',
        { type: 'uuid USING spread_id::uuid' },
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
