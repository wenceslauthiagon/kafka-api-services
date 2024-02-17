'use strict';

const { v4: uuidV4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const id = uuidV4();
      const now = new Date();

      await queryInterface.bulkInsert(
        'sms_templates',
        [
          {
            id,
            body: 'Uhu! Que bom que você chegou!! Aqui esta o seu código: {{code}}',
            tag: 'SIGNUP_SMS_VALIDATE_PHONE_CODE',
            markups: '{code}',
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkDelete(
        'sms_templates',
        { tag: 'USER_SMS_VALIDATE_KEY_CODE' },
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
      await queryInterface.bulkDelete(
        'sms_templates',
        { tag: 'SIGNUP_SMS_VALIDATE_PHONE_CODE' },
        { transaction },
      );

      const id = uuidV4();
      const now = new Date();

      await queryInterface.bulkInsert(
        'sms_templates',
        [
          {
            id,
            markups: ['code'],
            body: 'Validação de telefone\nCódigo de validação: {{code}}',
            tag: 'USER_SMS_VALIDATE_KEY_CODE',
            created_at: now,
            updated_at: now,
          },
        ],
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
