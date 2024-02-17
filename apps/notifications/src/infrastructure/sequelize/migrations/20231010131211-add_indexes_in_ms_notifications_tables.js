'use strict';

const NOTIFICATIONS_TABLE = 'Notifications';
const EMAIL_TEMPLATES_TABLE = 'email_templates';
const SMS_TEMPLATES_TABLE = 'sms_templates';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: NOTIFICATIONS_TABLE,
        },
        ['uuid'],
        {
          transaction,
          name: `${NOTIFICATIONS_TABLE}_uuid_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: EMAIL_TEMPLATES_TABLE,
        },
        ['tag'],
        {
          transaction,
          name: `${EMAIL_TEMPLATES_TABLE}_tag_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: SMS_TEMPLATES_TABLE,
        },
        ['tag'],
        {
          transaction,
          name: `${SMS_TEMPLATES_TABLE}_tag_key`,
        },
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
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: NOTIFICATIONS_TABLE,
        },
        `${NOTIFICATIONS_TABLE}_uuid_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: EMAIL_TEMPLATES_TABLE,
        },
        `${EMAIL_TEMPLATES_TABLE}_tag_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: SMS_TEMPLATES_TABLE,
        },
        `${SMS_TEMPLATES_TABLE}_tag_key`,
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
