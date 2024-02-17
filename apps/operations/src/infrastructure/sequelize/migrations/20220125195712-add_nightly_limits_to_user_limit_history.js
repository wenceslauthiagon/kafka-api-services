'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Users_limits_history',
        'new_nightly_limit',
        {
          field: 'new_nigthly_limit',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits_history',
        'old_nightly_limit',
        {
          field: 'old_nigthly_limit',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
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
      await queryInterface.removeColumn(
        'Users_limits_history',
        'new_nightly_limit',
        { transaction },
      );
      await queryInterface.removeColumn(
        'Users_limits_history',
        'old_nightly_limit',
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
