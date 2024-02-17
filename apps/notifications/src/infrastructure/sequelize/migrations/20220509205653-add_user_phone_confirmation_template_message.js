const { v4: uuidV4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();
      await queryInterface.bulkInsert(
        'sms_templates',
        [
          {
            id: uuidV4(),
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
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete(
        'sms_templates',
        {
          tag: 'USER_SMS_VALIDATE_KEY_CODE',
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
