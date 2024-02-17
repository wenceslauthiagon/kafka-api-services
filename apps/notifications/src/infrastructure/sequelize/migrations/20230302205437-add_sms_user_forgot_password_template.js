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
            body: 'Zro Bank: seu código é {{code}}. Para manter a sua conta segura, não compartilhe esta informação.',
            tag: 'USER_SMS_FORGOT_PASSWORD_CODE',
            markups: ['code'],
            created_at: now,
            updated_at: now,
          },
        ],
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
        { tag: 'USER_SMS_FORGOT_PASSWORD_CODE' },
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
