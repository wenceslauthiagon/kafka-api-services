'use strict';

const { v4: uuidV4 } = require('uuid');
const { cpf } = require('cpf-cnpj-validator');

const PHONE_NUMBER = '5581912345678';
const user_uuid = '75b76701-3bb7-465d-9d23-ebecfde98bee';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM "Users" WHERE phone_number = '${PHONE_NUMBER}' ORDER BY id LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      if (users && users.length) return;

      await queryInterface.bulkInsert(
        'Users',
        [
          {
            uuid: user_uuid,
            name: 'Usuário de Development',
            email: 'teste@zrobank.xyz',
            cpf: cpf.generate(),
            genre: 'N',
            phone_number: '5581912345678',
            password:
              '$2a$10$gaqkK7/lpDX2IAPdio9yUueWVHGls.DKXH9IJ85B.00vyTkTP4ceW',
            pin: '$2a$10$gaqkK7/lpDX2IAPdio9yUueWVHGls.DKXH9IJ85B.00vyTkTP4ceW',
            pin_has_created: true,
            invite_code: '55555',
            telegram_confirm_code: '99999',
            onboarding_state: 'complete',
            id_business_source: 1,
            id_product: 1,
            due_date: 10,
            eula: true,
            state: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            bank_onboarding_state: 'complete',
            full_name: 'Nome Completo do Usuário',
            local_flags: 0,
            active: true,
            wallet_account_code: uuidV4(),
            props: JSON.stringify({ enable_pix: true }),
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
        'Users',
        { uuid: user_uuid },
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
