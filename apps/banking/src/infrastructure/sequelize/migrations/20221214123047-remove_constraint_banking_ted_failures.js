'use strict';

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "BankingTedFailures"
        DROP CONSTRAINT IF EXISTS "BankingTedFailures_operation_id_fkey";
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
