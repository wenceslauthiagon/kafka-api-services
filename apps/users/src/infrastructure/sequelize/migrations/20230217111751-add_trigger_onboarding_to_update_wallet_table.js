'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
          CREATE FUNCTION update_wallet_by_onboarding_finished()
          RETURNS TRIGGER LANGUAGE plpgsql AS
          $$
            BEGIN
              UPDATE "Wallets"
                SET state = 'active'
                WHERE
                  user_id = new.user_id AND "default" IS TRUE AND new.status = 'finished';

              UPDATE "Wallet_accounts"
                SET state = 'active'
                WHERE
                  wallet_uuid in (
                    SELECT
                      uuid
                    FROM
                      "Wallets"
                    WHERE
                      user_id = new.user_id AND "default" IS TRUE AND new.status = 'finished'
                  );
              RETURN new;
            END;
          $$;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          CREATE TRIGGER update_wallet_after_onboarding_finished AFTER UPDATE ON
          "Onboardings"
          FOR EACH ROW
          EXECUTE PROCEDURE update_wallet_by_onboarding_finished();
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
          DROP TRIGGER update_wallet_after_onboarding_finished ON "Onboardings";
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          DROP FUNCTION update_wallet_by_onboarding_finished();
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
