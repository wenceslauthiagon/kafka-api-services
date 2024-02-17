const { v4: uuidV4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();
      await queryInterface.bulkInsert(
        'email_templates',
        [
          {
            id: uuidV4(),
            markups: ['key', 'code'],
            title: 'Validação de Chave PIX {{key}}',
            body: 'Código de validação: {{code}}',
            html: null,
            tag: 'PIX_KEY_EMAIL_VALIDATE_KEY_CODE',
            created_at: now,
            updated_at: now,
          },
        ],
        {
          transaction,
        },
      );

      await queryInterface.bulkInsert(
        'sms_templates',
        [
          {
            id: uuidV4(),
            markups: ['key', 'code'],
            body: 'Validação de Chave PIX {{key}}\nCódigo de validação: {{code}}',
            tag: 'PIX_KEY_SMS_VALIDATE_KEY_CODE',
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
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete(
        'email_templates',
        {
          tag: 'PIX_KEY_EMAIL_VALIDATE_KEY_CODE',
        },
        {
          transaction,
        },
      );
      await queryInterface.bulkDelete(
        'sms_templates',
        {
          tag: 'PIX_KEY_SMS_VALIDATE_KEY_CODE',
        },
        {
          transaction,
        },
      );
      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },
};
