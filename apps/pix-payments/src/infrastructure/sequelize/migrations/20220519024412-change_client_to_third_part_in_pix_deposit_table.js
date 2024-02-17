'use strict';
module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `
        UPDATE pix_deposits SET
          client_branch=third_part_branch,
          client_account_number=third_part_account_number,
          client_document=third_part_document,
          client_name=third_part_name,
          client_key=third_part_key,
          client_person_type=third_part_person_type,
          third_part_branch=client_branch,
          third_part_account_type='CACC',
          third_part_account_number=client_account_number,
          third_part_document=client_document,
          third_part_name=client_name,
          third_part_key=client_key,
          third_part_person_type=client_person_type
        WHERE client_bank_ispb='26264220' AND third_part_bank_ispb='26264220'
        `,
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `
        UPDATE pix_deposits SET
          client_branch=third_part_branch,
          client_account_number=third_part_account_number,
          client_document=third_part_document,
          client_name=third_part_name,
          client_key=third_part_key,
          client_person_type=third_part_person_type
          third_part_branch=client_branch,
          third_part_account_type='CACC',
          third_part_account_number=client_account_number,
          third_part_document=client_document,
          third_part_name=client_name,
          third_part_key=client_key,
          third_part_person_type=client_person_type,
        WHERE client_bank_ispb='26264220' AND third_part_bank_ispb='26264220'
        `,
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
