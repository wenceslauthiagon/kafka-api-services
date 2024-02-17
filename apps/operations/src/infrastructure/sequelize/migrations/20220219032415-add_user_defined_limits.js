'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Global_limits',
        'user_nightly_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits',
        'user_nightly_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits_history',
        'old_user_nightly_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits_history',
        'new_user_nightly_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Global_limits',
        'user_daily_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits',
        'user_daily_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits_history',
        'old_user_daily_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits_history',
        'new_user_daily_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Global_limits',
        'user_monthly_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits',
        'user_monthly_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits_history',
        'old_user_monthly_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits_history',
        'new_user_monthly_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Global_limits',
        'user_yearly_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits',
        'user_yearly_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits_history',
        'old_user_yearly_limit',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits_history',
        'new_user_yearly_limit',
        {
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Global_limits', 'user_nightly_limit', {
        transaction,
      });

      await queryInterface.removeColumn('Users_limits', 'user_nightly_limit', {
        transaction,
      });

      await queryInterface.removeColumn(
        'Users_limits_history',
        'old_user_nightly_limit',
        { transaction },
      );

      await queryInterface.removeColumn(
        'Users_limits_history',
        'new_user_nightly_limit',
        { transaction },
      );

      await queryInterface.removeColumn('Global_limits', 'user_daily_limit', {
        transaction,
      });

      await queryInterface.removeColumn('Users_limits', 'user_daily_limit', {
        transaction,
      });

      await queryInterface.removeColumn(
        'Users_limits_history',
        'old_user_daily_limit',
        { transaction },
      );

      await queryInterface.removeColumn(
        'Users_limits_history',
        'new_user_daily_limit',
        { transaction },
      );

      await queryInterface.removeColumn('Global_limits', 'user_monthly_limit', {
        transaction,
      });

      await queryInterface.removeColumn('Users_limits', 'user_monthly_limit', {
        transaction,
      });

      await queryInterface.removeColumn(
        'Users_limits_history',
        'old_user_monthly_limit',
        { transaction },
      );

      await queryInterface.removeColumn(
        'Users_limits_history',
        'new_user_monthly_limit',
        { transaction },
      );

      await queryInterface.removeColumn('Global_limits', 'user_yearly_limit', {
        transaction,
      });

      await queryInterface.removeColumn('Users_limits', 'user_yearly_limit', {
        transaction,
      });

      await queryInterface.removeColumn(
        'Users_limits_history',
        'old_user_yearly_limit',
        { transaction },
      );

      await queryInterface.removeColumn(
        'Users_limits_history',
        'new_user_yearly_limit',
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
