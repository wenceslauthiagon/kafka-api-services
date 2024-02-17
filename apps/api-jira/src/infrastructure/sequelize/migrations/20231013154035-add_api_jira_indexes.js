'use strict';

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'jira_notify_pix_infraction_issues',
      },
      ['issue_id'],
      { name: 'jira_notify_pix_infraction_issues_issue_id_key', transaction },
    );

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'jira_notify_pix_refund_issues',
      },
      ['issue_id'],
      { name: 'jira_notify_pix_refund_issues_issue_id_key', transaction },
    );

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'jira_notify_user_limit_request_issues',
      },
      ['issue_id'],
      {
        name: 'jira_notify_user_limit_request_issues_issue_id_key',
        transaction,
      },
    );

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'jira_notify_user_withdraw_setting_request_issues',
      },
      ['issue_id'],
      {
        name: 'jira_notify_user_withdraw_setting_request_issues_issue_id_key',
        transaction,
      },
    );

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'jira_notify_warning_transaction_issues',
      },
      ['issue_id'],
      {
        name: 'jira_notify_warning_transaction_issues_issue_id_key',
        transaction,
      },
    );
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'jira_notify_pix_infraction_issues',
      },
      ['issue_id'],
      { name: 'jira_notify_pix_infraction_issues_issue_id_key', transaction },
    );

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'jira_notify_pix_refund_issues',
      },
      ['issue_id'],
      { name: 'jira_notify_pix_refund_issues_issue_id_key', transaction },
    );

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'jira_notify_user_limit_request_issues',
      },
      ['issue_id'],
      {
        name: 'jira_notify_user_limit_request_issues_issue_id_key',
        transaction,
      },
    );

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'jira_notify_user_withdraw_setting_request_issues',
      },
      ['issue_id'],
      {
        name: 'jira_notify_user_withdraw_setting_request_issues_issue_id_key',
        transaction,
      },
    );

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'jira_notify_warning_transaction_issues',
      },
      ['issue_id'],
      {
        name: 'jira_notify_warning_transaction_issues_issue_id_key',
        transaction,
      },
    );
  },
};
