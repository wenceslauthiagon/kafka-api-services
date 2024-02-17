'use strict';

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
            markups: ['code'],
            title: 'Quase lá! Confirme seu endereço de e-mail.',
            body: null,
            html: `<!DOCTYPE html><html :alto_voltaje:4email data-css-strict><head><meta charset="utf-8"><script async src="https://cdn.ampproject.org/v0.js"></script><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"><style amp-custom>body{font-family:Roboto,sans-serif}#main-container{background-color:#f6f8fb}#main-container a{cursor:pointer;text-decoration:none;display:block}#main-container .bg-primary{background:linear-gradient(90deg,rgba(236,102,107,1) 0,rgba(233,146,93,1) 60%)}#main-container .header{text-align:center;margin:0 auto}#main-container .content{width:70%;text-align:left;margin:0 auto;padding:3rem 0}#main-container .content h1{color:#223354;font-weight:bolder;margin-bottom:50px}#main-container .content p{color:#223354;opacity:.5}#main-container .container-call-to-action{display:flex;margin:2rem 0}#main-container .call-to-action{background:linear-gradient(90deg,rgba(236,102,107,1) 0,rgba(233,146,93,1) 60%);padding:.6rem 1.2rem;border-radius:8px;font-size:15px}#main-container .content .team{color:#223354;font-weight:bolder;margin-bottom:15px}#main-container .content .team p{opacity:1;margin-bottom:15px}#main-container .footer{text-align:center;color:#222;padding:1rem 0}#main-container .footer-link{width:100%}</style></head><body><div id="main-container"><div class="header bg-primary"><img alt="ZroBank - Banco + Cripto" src="https://www.zrobank.com.br/wp-content/themes/zrobank/assets/images/favico.png" width="200" height="200"></div><div class="content"><h1>Quase lá! Confirme seu endereço<br>de e-mail.</h1><div class="main-content"><p>Seu código de verificação.</p><div class="container-call-to-action"><span class="call-to-action">{{code}}</span></div></div><div class="team"><p>Digite o código de verificação no seu celular para<br>confirmar que este é o seu e-mail.</p></div></div><div class="footer bg-primary"><div class="footer-link"><p>Enviado por Zro Bank</p><a href="https://www.zrobank.com.br" target="_blank" data-vars-event-id="click">https://www.zrobank.com.br</a></div></div></div></body></html>`,
            tag: 'API_USERS_EMAIL_VALIDATE_CODE',
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
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
          tag: 'API_USERS_EMAIL_VALIDATE_CODE',
        },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },
};
