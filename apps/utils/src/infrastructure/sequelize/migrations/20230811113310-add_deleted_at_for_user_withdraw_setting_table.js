'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableDefinition = await queryInterface.describeTable(
        'users_withdraws_settings',
      );

      if (!tableDefinition['deleted_at']) {
        await queryInterface.addColumn(
          'users_withdraws_settings',
          'deleted_at',
          { type: Sequelize.DATE, allowNull: true, defaultValue: null },
          { transaction },
        );
      }

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
      await queryInterface.removeColumn(
        'users_withdraws_settings',
        'deleted_at',
        {
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
