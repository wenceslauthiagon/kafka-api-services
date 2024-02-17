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
            body: 'Seu cadastro no Zro Gateway foi aprovado com sucesso!. Use o Código de confirmação: {{code}} para aceitar fazer parte da rede de {{name}}. Aceite o convite em: {{url}}',
            tag: 'OPERATION_SMS_INVITE_WALLET',
            markups: ['name', 'url', 'code'],
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
        { tag: 'OPERATION_SMS_INVITE_WALLET' },
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
