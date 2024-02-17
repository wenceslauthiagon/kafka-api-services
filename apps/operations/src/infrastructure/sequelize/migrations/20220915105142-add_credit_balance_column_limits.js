'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Global_limits',
        'credit_balance',
        {
          type: Sequelize.BIGINT,
          defaultValue: 0,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits',
        'credit_balance',
        {
          type: Sequelize.BIGINT,
          defaultValue: 0,
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
      await queryInterface.removeColumn('Global_limits', 'credit_balance', {
        transaction,
      });

      await queryInterface.removeColumn('Users_limits', 'credit_balance', {
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
