'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'wallet_account_caches',
        'uuid',
        {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'wallet_account_caches',
        'wallet_uuid',
        {
          type: Sequelize.UUID,
          allowNull: true,
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('wallet_account_caches', 'uuid', {
        transaction,
      });
      await queryInterface.removeColumn(
        'wallet_account_caches',
        'wallet_uuid',
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
