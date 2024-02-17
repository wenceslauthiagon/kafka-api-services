'use strict';

const currencies = [
  {
    title: 'Ether',
    symbol: 'ETH',
    symbol_align: 'right',
    tag: 'ETH',
    type: 'CRYPTO',
    decimal: 18,
    state: 'active',
  },
  {
    title: 'Tether',
    symbol: 'USDT',
    symbol_align: 'right',
    tag: 'USDT',
    type: 'CRYPTO',
    decimal: 6,
    state: 'active',
  },
  {
    title: 'RealZ',
    symbol: 'BRZ',
    symbol_align: 'left',
    tag: 'REAL',
    decimal: 2,
    state: 'active',
    type: 'CRYPTO',
  },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const providers = await queryInterface.sequelize.query(
        `SELECT id FROM "Currencies" WHERE symbol IN (:symbols) LIMIT 1`,
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { symbols: currencies.map(({ symbol }) => symbol) },
        },
      );

      if (providers && providers.length) return;

      await queryInterface.bulkInsert('Currencies', currencies, {
        transaction,
      });
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
        'Currencies',
        {
          symbol: { [Op.in]: currencies.map(({ symbol }) => symbol) },
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
