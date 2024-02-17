'use strict';
module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `
        UPDATE "pix_deposits" SET "end_to_end_id" = NULL WHERE "operation_id" IN (
          SELECT "operation_id" FROM "pix_payments" WHERE "end_to_end_id" IS NULL AND "state" = 'CONFIRMED'
        )
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
  down: async () => console.log('Nothing to do.'),
};
