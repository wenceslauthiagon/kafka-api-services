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
            body: 'O {{name}} convida vocês a criarem uma conta no Zro Bank para que possam visualizar as transações via Pix do seu negócio direto pela nossa plataforma digital Zro Gateway. Inicie seu cadastro em: {{url}}',
            tag: 'OPERATION_SMS_INVITE_SIGNUP',
            markups: ['name', 'url'],
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
        { tag: 'OPERATION_SMS_INVITE_SIGNUP' },
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
