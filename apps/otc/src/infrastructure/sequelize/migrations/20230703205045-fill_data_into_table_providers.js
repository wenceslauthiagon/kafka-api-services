'use strict';

const binanceProvider = {
  id: '632d380b-64bb-429a-a7b4-2d6cd98c864f',
  name: 'BINANCE',
  description: 'BINANCE',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('Providers', [binanceProvider], {
        transaction,
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete(
        'Providers',
        { id: binanceProvider.id },
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
