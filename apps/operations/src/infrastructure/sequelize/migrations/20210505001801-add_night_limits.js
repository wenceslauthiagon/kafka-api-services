module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Global_limits',
        'nightly_limit',
        {
          field: 'nigthly_limit',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits',
        'nightly_limit',
        {
          field: 'nigthly_limit',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Limit_types',
        'nighttime_start',
        {
          ffield: 'nighttime_start',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Limit_types',
        'nighttime_end',
        {
          ffield: 'nighttime_end',
          type: Sequelize.STRING,
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
      await queryInterface.removeColumn('Global_limits', 'nightly_limit', {
        transaction,
      });

      await queryInterface.removeColumn('Users_limits', 'nightly_limit', {
        transaction,
      });

      await queryInterface.removeColumn('Limit_types', 'nighttime_start', {
        transaction,
      });

      await queryInterface.removeColumn('Limit_types', 'nighttime_end', {
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
