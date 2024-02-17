'use strict';

const user_id = 1;
const user_uuid = '75b76701-3bb7-465d-9d23-ebecfde98bee';
const wallet_uuid = 'fd9f1148-8056-4e13-b6d5-000022f7524b';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const ids = await queryInterface.sequelize.query(
        `SELECT id FROM "Wallets" WHERE user_id = ${user_id} AND user_uuid = '${user_uuid}'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );
      if (ids && ids.length) return;

      await queryInterface.bulkInsert(
        'Wallets',
        [
          {
            uuid: wallet_uuid,
            user_id: user_id,
            state: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_uuid: user_uuid,
            deleted_at: null,
          },
        ],
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
      await queryInterface.bulkDelete(
        'Wallets',
        { user_id: user_id },
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
