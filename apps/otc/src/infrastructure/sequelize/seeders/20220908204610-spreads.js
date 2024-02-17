'use strict';

const uuid = require('uuid');

const currencies = [
  { id: 1, symbol: 'BRL' },
  { id: 2, symbol: 'BTC' },
  { id: 3, symbol: 'USD' },
  { id: 4, symbol: 'EUR' },
  { id: 5, symbol: 'ETH' },
  { id: 6, symbol: 'USDT' },
  { id: 7, symbol: 'BRZ' },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const spreads = await queryInterface.sequelize.query(
        `SELECT id FROM "spreads" WHERE currency_symbol IN (:symbols) AND deleted_at IS NULL`,
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { symbols: currencies.map(({ symbol }) => symbol) },
        },
      );

      if (spreads && spreads.length) return;

      await queryInterface.bulkInsert(
        'spreads',
        currencies.map(({ id, symbol }) => ({
          id: uuid.v4(),
          currency_id: id,
          currency_symbol: symbol,
          buy: 100,
          sell: 100,
          amount: 10000000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const Op = Sequelize.Op;

    try {
      await queryInterface.bulkDelete(
        'spreads',
        {
          currency_symbol: { [Op.in]: currencies.map(({ symbol }) => symbol) },
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
};
