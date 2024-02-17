'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        UPDATE sms_templates SET body = 'O {{name}} convida vocês a criarem uma conta no Zro Bank. Inicie seu cadastro.'
        where tag = 'OPERATION_SMS_INVITE_SIGNUP'
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
        UPDATE sms_templates SET body = 'O {{name}} convida vocês a criarem uma conta no Zro Bank para que possam visualizar as transações via Pix do seu negócio direto pela nossa plataforma digital Zro Gateway. Inicie seu cadastro em: {{url}}'
        where tag = 'OPERATION_SMS_INVITE_SIGNUP'
    `);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
