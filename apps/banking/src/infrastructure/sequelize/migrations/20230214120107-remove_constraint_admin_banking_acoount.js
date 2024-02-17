'use strict';

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "AdminBankingAccounts"
        DROP CONSTRAINT IF EXISTS "AdminBankingAccounts_created_by_fkey";
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "AdminBankingAccounts"
        DROP CONSTRAINT IF EXISTS "AdminBankingAccounts_updated_by_fkey";
        `,
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },
  down: async () => console.log('Nothing to do.'),
};
