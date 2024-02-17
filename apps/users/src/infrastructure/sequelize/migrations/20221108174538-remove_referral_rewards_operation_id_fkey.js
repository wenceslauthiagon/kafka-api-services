'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Referral_rewards"
        DROP CONSTRAINT IF EXISTS "Referral_rewards_operation_id_fkey";
        `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Referral_rewards"
        DROP CONSTRAINT IF EXISTS "Referral_rewards_payment_operation_id_fkey";
        `,
        { transaction },
      );
      await queryInterface.changeColumn(
        'Referral_rewards',
        'operation_id',
        { type: Sequelize.UUID, unique: true },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Referral_rewards"
        DROP CONSTRAINT IF EXISTS "Referral_rewards_operation_id_key";
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
