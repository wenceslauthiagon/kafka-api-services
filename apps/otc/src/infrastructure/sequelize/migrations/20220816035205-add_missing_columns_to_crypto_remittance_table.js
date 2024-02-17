'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'crypto_remittances',
        'stop_price',
        {
          type: Sequelize.INTEGER,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'crypto_remittances',
        'valid_until',
        {
          type: Sequelize.DATE,
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
      await queryInterface.removeColumn('crypto_remittances', 'stop_price', {
        transaction,
      });

      await queryInterface.removeColumn('crypto_remittances', 'valid_until', {
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
