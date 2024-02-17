'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'p2p_transfers',
        'wallet_id',
        { type: Sequelize.UUID },
        { transaction },
      );
      await queryInterface.addColumn(
        'p2p_transfers',
        'beneficiary_wallet_id',
        { type: Sequelize.UUID },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE p2p_transfers pt
          SET wallet_id = wa.wallet_uuid
          FROM "Operations" o, "Wallet_accounts" wa
          WHERE pt.operation_id = o.id AND wa.id = o.owner_wallet_id
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE p2p_transfers pt
          SET beneficiary_wallet_id = wa.wallet_uuid
          FROM "Operations" o, "Wallet_accounts" wa
          WHERE pt.operation_id = o.id AND wa.id = o.beneficiary_wallet_id
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
      await queryInterface.removeColumn('p2p_transfers', 'wallet_id', {
        transaction,
      });
      await queryInterface.removeColumn(
        'p2p_transfers',
        'beneficiary_wallet_id',
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
