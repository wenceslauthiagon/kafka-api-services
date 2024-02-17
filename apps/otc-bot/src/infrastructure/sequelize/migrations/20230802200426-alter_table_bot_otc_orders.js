'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      //Add Column
      await queryInterface.addColumn(
        'bot_otc_orders',
        'buy_bank_quote',
        {
          field: 'buy_bank_quote',
          type: Sequelize.BIGINT,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'bot_otc_orders',
        'buy_remittance_id',
        {
          field: 'buy_remittance_id',
          type: Sequelize.UUID,
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
      await queryInterface.removeColumn('bot_otc_orders', 'buy_bank_quote', {
        transaction,
      });

      await queryInterface.removeColumn('bot_otc_orders', 'buy_remittance_id', {
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
