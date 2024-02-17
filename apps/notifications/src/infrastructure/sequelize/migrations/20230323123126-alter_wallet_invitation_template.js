'use strict';

const { v4: uuidV4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete(
        'email_templates',
        {
          tag: 'OPERATION_EMAIL_INVITE_SIGNUP',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'sms_templates',
        {
          tag: 'OPERATION_SMS_INVITE_SIGNUP',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'sms_templates',
        {
          tag: 'OPERATION_SMS_INVITE_WALLET',
        },
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
      const now = new Date();
      await queryInterface.bulkInsert(
        'email_templates',
        [
          {
            id: uuidV4(),
            markups: ['name', 'url'],
            title: 'Crie sua conta no Zro Bank',
            body: null,
            html: `<!DOCTYPE html><html :alto_voltaje:4email data-css-strict><head><meta charset="utf-8"><script async src="https://cdn.ampproject.org/v0.js"></script><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"><style amp-custom>body{font-family:Roboto,sans-serif}#main-container{background-color:#f6f8fb}#main-container a{cursor:pointer;text-decoration:none;display:block}#main-container .bg-primary{background-color:#3a3d79;height:278px}#main-container .header{display:flex;align-items:center;justify-content:center}#main-container .content{width:70%;text-align:left;margin:0 auto;padding:3rem 0}#main-container .content h1{color:#223354;font-weight:bolder;margin-bottom:50px}#main-container .content p{color:#223354;opacity:.5}#main-container .container-call-to-action{display:flex;margin:2rem 0}#main-container .call-to-action{background-color:#3a3d79;color:#f6f8fb;padding:.6rem 1.2rem;border-radius:8px;font-size:15px}#main-container .content .team{color:#223354;font-weight:bolder;margin-bottom:15px}#main-container .content .team p{opacity:1;margin-bottom:15px}</style></head><body><div id="main-container"><div class="header bg-primary"><amp-img alt="ZroBank - Banco + Cripto" src="https://www.zrobank.com.br/public_images/finance_email_template/logo.png" width="250" height="145"></amp-img></div><div class="content"><h1>Olá,</h1><div class="main-content"><p>O {{name}} convida vocês a criarem uma conta no Zro Bank para que possam visualizar as transações via Pix do seu negócio direto pela nossa plataforma digital Zro Gateway.</p><p>Para criar uma conta, é bastante simples.</p><p>Basta preencher o formulário a seguir e aguardar a mensagem de confirmação de cadastro.</p><div class="container-call-to-action"><a class="call-to-action" href="{{url}}" target="_blank">INICIAR MEU CADASTRO</a></div></div><div class="team"><p>Será um prazer atendê-los.</p><p>Atenciosamente,</p><p>Equipe Zro B2B</p></div></div><div class="footer bg-primary"></div></div></body></html>`,
            tag: 'OPERATION_EMAIL_INVITE_SIGNUP',
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'sms_templates',
        [
          {
            id: uuidV4(),
            body: 'O {{name}} convida vocês a criarem uma conta no Zro Bank para que possam visualizar as transações via Pix do seu negócio direto pela nossa plataforma digital Zro Gateway. Inicie seu cadastro em: {{url}}',
            tag: 'OPERATION_SMS_INVITE_SIGNUP',
            markups: ['name', 'url'],
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'sms_templates',
        [
          {
            id: uuidV4(),
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
};
