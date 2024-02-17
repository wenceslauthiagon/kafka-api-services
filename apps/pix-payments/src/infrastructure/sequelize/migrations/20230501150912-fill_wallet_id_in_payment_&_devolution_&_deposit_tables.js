'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await Promise.all([
        queryInterface.sequelize.query(
          `
            UPDATE pix_payments pp
            SET wallet_id = w.uuid
            FROM "Wallets" w
            WHERE pp.user_id = w.user_uuid AND w."default" IS TRUE
          `,
          { transaction },
        ),
        queryInterface.sequelize.query(
          `
            UPDATE pix_deposits pd
            SET wallet_id = w.uuid
            FROM "Wallets" w
            WHERE pd.user_id = w.user_uuid AND w."default" IS TRUE
          `,
          { transaction },
        ),
        queryInterface.sequelize.query(
          `
            UPDATE pix_devolutions pd
            SET wallet_id = w.uuid
            FROM "Wallets" w
            WHERE pd.user_id = w.user_uuid AND w."default" IS TRUE
          `,
          { transaction },
        ),
        queryInterface.sequelize.query(
          `
            UPDATE pix_devolutions_received pdr
            SET wallet_id = w.uuid
            FROM "Wallets" w
            WHERE pdr.user_id = w.user_uuid AND w."default" IS TRUE
          `,
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
  down: async () => console.log('Nothing to do.'),
};
