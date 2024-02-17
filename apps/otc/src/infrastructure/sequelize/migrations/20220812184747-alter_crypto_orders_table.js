'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE crypto_orders ALTER COLUMN user_id DROP NOT NULL',
        { transaction },
      );

      await queryInterface.addColumn(
        'crypto_orders',
        'conversion_id',
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

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE crypto_orders ALTER COLUMN user_id SET NOT NULL;',
        { transaction },
      );
      await queryInterface.removeColumn('crypto_orders', 'conversion_id', {
        transaction,
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
