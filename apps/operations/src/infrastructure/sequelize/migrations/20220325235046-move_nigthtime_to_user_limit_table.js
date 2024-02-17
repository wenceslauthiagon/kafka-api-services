'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Limit_types', 'nighttime_start', {
        transaction,
      });

      await queryInterface.removeColumn('Limit_types', 'nighttime_end', {
        transaction,
      });

      await queryInterface.addColumn(
        'Users_limits',
        'nighttime_start',
        {
          field: 'nighttime_start',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits',
        'nighttime_end',
        {
          field: 'nighttime_end',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Global_limits',
        'nighttime_start',
        {
          field: 'nighttime_start',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Global_limits',
        'nighttime_end',
        {
          field: 'nighttime_end',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Limit_types',
        'nighttime_start',
        {
          field: 'nighttime_start',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Limit_types',
        'nighttime_end',
        {
          field: 'nighttime_end',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.removeColumn('Users_limits', 'nighttime_start', {
        transaction,
      });

      await queryInterface.removeColumn('Users_limits', 'nighttime_end', {
        transaction,
      });

      await queryInterface.removeColumn('Global_limits', 'nighttime_start', {
        transaction,
      });

      await queryInterface.removeColumn('Global_limits', 'nighttime_end', {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },
};
