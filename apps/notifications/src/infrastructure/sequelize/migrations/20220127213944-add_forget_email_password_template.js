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
            markups: ['name', 'url', 'resetToken'],
            title: 'Recuperar Senha | Zro Bank',
            body: null,
            html: `<html lang=en><title>Forgot password e-mail</title><style>@import url(https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap);:root{--primary:#3a3d79;--secondary:#e5e5e5;--primary-font:#223354;--strong-gray:#c5c5c5;--link:#1a75ff}*,html{margin:0;padding:0;font-family:Roboto,sans-serif;font-size:100%}body{background-color:var(--primary);height:100%}a,p{font-size:clamp(.75rem,2vw,1.5rem);margin-bottom:1.875rem}.verification-code p,h1{font-size:clamp(1.5rem,4vw,2.65rem)}a{color:var(--link);cursor:pointer;text-decoration:none;display:block}footer,header{height:278px}header{display:grid;place-items:center}header img{width:429px;height:auto}main{background-color:#f6f8fb;padding:66px 0}.content{width:70%;text-align:left;margin:0 auto}.content h1{color:var(--primary-font);font-weight:bolder;margin-bottom:66px}.content p{color:var(--primary-font);opacity:.5}.main-content{margin-bottom:100px}.verification-code-container{padding-left:40px;margin-bottom:70px;max-width:310px}.verification-code{background-color:var(--strong-gray);padding:25px 35px}.verification-code p{text-align:center;color:var(--primary-font);font-weight:bolder;margin:0;opacity:1}.content .strong-text{color:var(--primary-font);font-weight:bolder;margin-bottom:15px}.content .strong-text p{opacity:1;margin-bottom:15px}</style><header><img alt="Zro Bank Logo"src=https://www.zrobank.com.br/public_images/finance_email_template/logo.png></header><main><section class=content><h1>Olá, {{name}}</h1><section class=main-content><p>Este é o seu código único para a alteração de senha<div class=verification-code-container><div class=verification-code><p>{{resetToken}}</div></div><a href="{{ url }}"target=_blank>Clique aqui para alterar sua senha</a><p>Caso não consiga alterar a senha você poderá tentar novamente</section><div class=strong-text><p>Um abraço,<p>Equipe Zro Bank</div></section></main><footer></footer>`,
            tag: 'API_ADMIN_EMAIL_VALIDATE_CODE',
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
          tag: 'API_ADMIN_EMAIL_VALIDATE_CODE',
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
