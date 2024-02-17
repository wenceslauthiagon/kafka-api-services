'use strict';

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Conversions"
        DROP CONSTRAINT IF EXISTS "Conversions_remittance_id_fkey";
        `,
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      throw error;
    }
  },
  down: async () => console.log('Nothing to do.'),
};
