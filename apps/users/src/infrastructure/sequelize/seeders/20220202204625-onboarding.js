'use strict';

const { v4: uuidV4 } = require('uuid');

const FULL_NAME = 'Usuário de Development Silva';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const users = await queryInterface.sequelize.query(
        'SELECT id FROM "Users" ORDER BY id LIMIT 1',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      if (!users || !users.length) return;

      const addresses = await queryInterface.sequelize.query(
        'SELECT id FROM "Addresses" ORDER BY id LIMIT 1',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      const userId = users[0].id;
      const addressId =
        addresses && addresses.length ? addresses[0].id : undefined;

      await queryInterface.bulkInsert(
        'Onboardings',
        [
          {
            id: uuidV4(),
            user_id: userId,
            address_id: addressId,
            full_name_status: 'pending',
            mother_name_status: 'pending',
            birth_date_status: 'pending',
            pep: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'finished',
            front_document_status: 'pending',
            selfie_status: 'pending',
            back_document_status: 'pending',
            topazio_account_number: '14233733',
            topazio_branch_number: '0519',
            facematch_status: 'pending',
            pin_status: 'pending',
            full_name: FULL_NAME,
            review_processed: false,
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
        'Onboardings',
        { full_name: FULL_NAME },
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
