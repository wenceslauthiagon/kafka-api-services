'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
          UPDATE "Wallet_accounts" wa
          SET wallet_uuid = w.uuid
          FROM "Wallets" w
          WHERE wa.wallet_id = w.id
        `,
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
  down: async () => console.log('Nothing to do.'),
};
