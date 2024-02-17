'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'webhook_events',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          state: {
            allowNull: false,
            type: Sequelize.STRING,
          },
          targetUrl: {
            field: 'target_url',
            allowNull: false,
            type: Sequelize.STRING,
          },
          apiKey: {
            field: 'api_key',
            allowNull: false,
            type: Sequelize.STRING,
          },
          webhookId: {
            field: 'webhook_id',
            allowNull: false,
            type: Sequelize.UUID,
          },
          type: {
            field: 'type',
            allowNull: false,
            type: Sequelize.STRING,
          },
          accountNumber: {
            field: 'account_number',
            allowNull: false,
            type: Sequelize.STRING,
          },
          agencyNumber: {
            field: 'agency_number',
            allowNull: false,
            type: Sequelize.STRING,
          },
          httpStatusCodeResponse: {
            field: 'http_status_code_response',
            allowNull: true,
            type: Sequelize.STRING,
          },
          data: {
            field: 'data',
            allowNull: false,
            type: Sequelize.TEXT,
          },
          retryLimit: {
            field: 'retry_limit',
            allowNull: false,
            type: Sequelize.DATE,
          },
          lastRetry: {
            field: 'last_retry',
            allowNull: true,
            type: Sequelize.DATE,
          },
          createdAt: {
            field: 'created_at',
            allowNull: false,
            type: Sequelize.DATE,
          },
          updatedAt: {
            field: 'updated_at',
            allowNull: false,
            type: Sequelize.DATE,
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
      await queryInterface.dropTable('webhook_events', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
