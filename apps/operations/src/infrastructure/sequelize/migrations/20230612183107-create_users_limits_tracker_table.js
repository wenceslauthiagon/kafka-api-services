'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('users_limits_tracker', {
        id: {
          field: 'id',
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        userLimitId: {
          field: 'user_limit_id',
          type: Sequelize.UUID,
          allowNull: false,
        },
        periodStart: {
          field: 'period_start',
          type: Sequelize.STRING,
          allowNull: false,
        },
        usedDailyLimit: {
          field: 'used_daily_limit',
          type: Sequelize.BIGINT,
          defaultValue: 0,
          allowNull: false,
        },
        usedMonthlyLimit: {
          field: 'used_monthly_limit',
          type: Sequelize.BIGINT,
          defaultValue: 0,
          allowNull: false,
        },
        usedAnnualLimit: {
          field: 'used_annual_limit',
          type: Sequelize.BIGINT,
          defaultValue: 0,
          allowNull: false,
        },
        usedNightlyLimit: {
          field: 'used_nightly_limit',
          type: Sequelize.BIGINT,
          defaultValue: 0,
          allowNull: false,
        },
        createdAt: {
          field: 'created_at',
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Date.now(),
        },
        updatedAt: {
          field: 'updated_at',
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Date.now(),
        },
      });

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
      await queryInterface.dropTable('users_limits_tracker', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
