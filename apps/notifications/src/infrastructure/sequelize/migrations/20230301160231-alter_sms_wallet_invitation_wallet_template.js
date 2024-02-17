'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        UPDATE sms_templates SET body = 'Uhu! Use o Código de confirmação: {{code}} e aceite seu convite para carteira.'
        where tag = 'OPERATION_SMS_INVITE_WALLET'
      `);
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
      await queryInterface.sequelize.query(`
        UPDATE sms_templates SET body = 'Seu cadastro no Zro Gateway foi aprovado com sucesso!. Use o Código de confirmação: {{code}} para aceitar fazer parte da rede de {{name}}. Aceite o convite em: {{url}}'
        where tag = 'OPERATION_SMS_INVITE_WALLET'
    `);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
