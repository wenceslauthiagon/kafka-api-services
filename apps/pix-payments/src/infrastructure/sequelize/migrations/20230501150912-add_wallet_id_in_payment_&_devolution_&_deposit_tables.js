'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await Promise.all([
        queryInterface.addColumn(
          'pix_payments',
          'wallet_id',
          { type: Sequelize.UUID },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_deposits',
          'wallet_id',
          { type: Sequelize.UUID },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_devolutions',
          'wallet_id',
          { type: Sequelize.UUID },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_devolutions_received',
          'wallet_id',
          { type: Sequelize.UUID },
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await Promise.all([
        queryInterface.removeColumn('pix_payments', 'wallet_id', {
          transaction,
        }),
        queryInterface.removeColumn('pix_deposits', 'wallet_id', {
          transaction,
        }),
        queryInterface.removeColumn('pix_devolutions', 'wallet_id', {
          transaction,
        }),
        queryInterface.removeColumn('pix_devolutions_received', 'wallet_id', {
          transaction,
        }),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
