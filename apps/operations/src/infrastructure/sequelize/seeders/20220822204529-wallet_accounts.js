'use strict';

const { v4: uuidV4 } = require('uuid');

const currencies = [
  { id: 1, symbol: 'BRL' },
  { id: 2, symbol: 'BTC' },
  { id: 3, symbol: 'USD' },
  { id: 4, symbol: 'EUR' },
  { id: 5, symbol: 'ETH' },
  { id: 6, symbol: 'USDT' },
  { id: 7, symbol: 'BRZ' },
];
const user_id = 1;
const user_uuid = '75b76701-3bb7-465d-9d23-ebecfde98bee';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const wallets = await queryInterface.sequelize.query(
        `SELECT id, uuid FROM "Wallets" WHERE user_id = ${user_id} AND user_uuid = '${user_uuid}'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );
      if (!wallets.length) return;
      const [wallet] = wallets;

      const last_wallets = await queryInterface.sequelize.query(
        `SELECT id FROM "Wallet_accounts" WHERE wallet_id = ${wallet.id}`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );
      if (last_wallets.length) return;
      await queryInterface.bulkInsert(
        'Wallet_accounts',
        currencies.map(({ id }) => ({
          uuid: uuidV4(),
          wallet_id: wallet.id,
          wallet_uuid: wallet.uuid,
          currency_id: id,
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const wallets = await queryInterface.sequelize.query(
        `SELECT id FROM "Wallets" WHERE user_id = ${user_id} AND user_uuid = '${user_uuid}'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );
      if (!wallets.length) return;
      const [wallet_id] = wallets;

      await queryInterface.bulkDelete(
        'Wallet_accounts',
        { wallet_id: wallet_id.id },
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
