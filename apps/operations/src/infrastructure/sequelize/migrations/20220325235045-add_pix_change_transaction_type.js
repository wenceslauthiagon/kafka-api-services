'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
          UPDATE "Operations"
          SET reverted_at = updated_at
          WHERE state = 'reverted' and reverted_at is null
        `,
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'PIX change type',
            tag: 'PIXCHANGE',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "Transaction_types"
          SET tag = 'PIXWITHDRAWAL'
          WHERE tag = 'PIXWDWALCHANGE'
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "Limit_types"
          SET tag = 'PIXWITHDRAWAL', description = 'Limite para saque via PIX'
          WHERE tag = 'PIXWDWALCHANGE'
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          INSERT INTO "Limit_types" (
            tag,
            transaction_type_id,
            currency_id,
            description,
            period_start,
            "check",
            nighttime_start,
            nighttime_end,
            created_at,
            updated_at
          )
          VALUES (
            'PIXCHANGE',
            (SELECT id FROM "Transaction_types" WHERE tag = 'PIXCHANGE'),
            (SELECT id FROM "Currencies" WHERE symbol = 'BRL'),
            'Limite para troco via PIX',
            'DATE',
            'OWNER',
            '22:00',
            '06:00',
            NOW(),
            NOW()
          )
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          INSERT INTO "Global_limits" (
            id,
            limit_type_id,
            daily_limit,
            monthly_limit,
            annual_limit,
            nightly_limit,
            max_amount,
            min_amount,
            user_daily_limit,
            user_monthly_limit,
            user_yearly_limit,
            user_nightly_limit,
            created_at,
            updated_at
          )
          VALUES (
            uuid_generate_v4(),
            (SELECT id FROM "Limit_types" l WHERE l.tag = 'PIXCHANGE'), 
            10000,
            300000,
            3660000,
            10000,
            null,
            null,
            null,
            null,
            null,
            null,
            NOW(),
            NOW()
          )
        `,
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
          DELETE FROM "Global_limits"
          USING "Limit_types"
          WHERE "Limit_types" .id = "Global_limits".limit_type_id
          AND "Limit_types".tag = 'PIXCHANGE'
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "Limit_types"
          WHERE tag = 'PIXCHANGE'
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "Limit_types"
          SET tag = 'PIXWDWALCHANGE', description = 'Limite para saque ou troco via PIX'
          WHERE tag = 'PIXWITHDRAWAL'
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "Transaction_types"
          SET tag = 'PIXWDWALCHANGE'
          WHERE tag = 'PIXWITHDRAWAL'
        `,
        { transaction },
      );

      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXCHANGE',
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
