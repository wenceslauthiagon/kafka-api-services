'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'jira_notify_pix_refund_issues',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          issueId: {
            field: 'issue_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          issueTypeId: {
            field: 'issue_type_id',
            type: Sequelize.INTEGER,
          },
          issueTypeName: {
            field: 'issue_type_name',
            type: Sequelize.STRING,
          },
          issueCreatedAt: {
            field: 'issue_created_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          projectId: {
            field: 'project_id',
            type: Sequelize.INTEGER,
          },
          projectKey: {
            field: 'project_key',
            type: Sequelize.STRING,
          },
          projectName: {
            field: 'project_name',
            type: Sequelize.STRING,
          },
          priorityId: {
            field: 'priority_id',
            type: Sequelize.INTEGER,
          },
          priorityName: {
            field: 'priority_name',
            type: Sequelize.STRING,
          },
          statusId: {
            field: 'status_id',
            type: Sequelize.INTEGER,
          },
          status: {
            field: 'status',
            type: Sequelize.STRING,
            allowNull: false,
          },
          eventType: {
            field: 'event_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          state: {
            field: 'state',
            type: Sequelize.STRING,
          },
          operationId: {
            field: 'operation_id',
            type: Sequelize.UUID,
          },
          description: {
            field: 'description',
            type: Sequelize.STRING,
          },
          reason: {
            field: 'reason',
            type: Sequelize.STRING,
            allowNull: false,
          },
          analysisDetails: {
            field: 'analysis_details',
            type: Sequelize.TEXT,
          },
          rejectionReason: {
            field: 'rejection_reason',
            type: Sequelize.STRING,
          },
          summary: {
            field: 'summary',
            type: Sequelize.STRING,
            allowNull: false,
          },
          assigneeName: {
            field: 'assignee_name',
            type: Sequelize.STRING,
          },
          creatorName: {
            field: 'creator_name',
            type: Sequelize.STRING,
          },
          reporterName: {
            field: 'reporter_name',
            type: Sequelize.STRING,
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

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('jira_notify_pix_refund_issues', {
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
