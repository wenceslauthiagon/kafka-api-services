'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'user_limit_requests',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          state: {
            field: 'state',
            type: Sequelize.STRING,
            allowNull: false,
          },
          status: {
            field: 'status',
            type: Sequelize.STRING,
            allowNull: false,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          userLimitId: {
            field: 'user_limit_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          analysisResult: {
            field: 'analysis_result',
            type: Sequelize.STRING,
            defaultValue: null,
          },
          requestYearlyLimit: {
            field: 'request_yearly_limit',
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
          },
          requestMonthlyLimit: {
            field: 'request_monthly_limit',
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
          },
          requestDailyLimit: {
            field: 'request_daily_limit',
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
          },
          requestNightlyLimit: {
            field: 'request_nightly_limit',
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
          },
          requestMaxAmount: {
            field: 'request_max_amount',
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
          },
          requestMinAmount: {
            field: 'request_min_amount',
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
          },
          requestMaxAmountNightly: {
            field: 'request_max_amount_nightly',
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
          },
          requestMinAmountNightly: {
            field: 'request_min_amount_nightly',
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
          },
          createdAt: {
            field: 'created_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          updatedAt: {
            field: 'updated_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
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
      await queryInterface.dropTable('user_limit_request', {
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
