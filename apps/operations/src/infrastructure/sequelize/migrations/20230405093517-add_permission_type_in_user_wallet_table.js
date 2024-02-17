'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'users_wallets',
        'permission_type_ids',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'ADMIN',
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE users_wallets SET permission_type_ids = 'ROOT'
          WHERE id IN (
            SELECT uw.id
              FROM users_wallets uw
              JOIN "Wallets" w ON w.uuid = uw.wallet_id
              WHERE w.user_uuid = uw.user_id
          )
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn(
        'users_wallets',
        'permission_type_ids',
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
