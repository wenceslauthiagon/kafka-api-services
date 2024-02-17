module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'PIX send type',
            tag: 'PIXSEND',
            participants: 'OWNER',
          },
          {
            title: 'PIX withdrawal/change type',
            tag: 'PIXWDWALCHANGE',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "Operations" 
          SET transaction_type_id = (
            SELECT id FROM "Transaction_types" WHERE tag = 'PIXSEND'
          )
          WHERE transaction_type_id IN (
            SELECT id
            FROM "Transaction_types"
            WHERE tag IN (
              'PIXSENDACC',
              'PIXSENDKEY',
              'PIXSENDQRS',
              'PIXSENDQRD',
              'PIXDUEDATEQRD'
            )
          )
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "Operations" 
          SET transaction_type_id = (
            SELECT id FROM "Transaction_types" WHERE tag = 'PIXWDWALCHANGE'
          )
          WHERE transaction_type_id IN (
            SELECT id
            FROM "Transaction_types"
            WHERE tag IN (
              'PIXWITHDRAWALQRS',
              'PIXWITHDRAWALQRD',
              'PIXCHANGEQRD'
            )
          )
        `,
        { transaction },
      );

      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXSENDACC',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXSENDKEY',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXSENDQRS',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXWITHDRAWALQRS',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXSENDQRD',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXWITHDRAWALQRD',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXCHANGEQRD',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXDUEDATEQRD',
        },
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
            'PIXSEND',
            (SELECT id FROM "Transaction_types" WHERE tag = 'PIXSEND'),
            (SELECT id FROM "Currencies" WHERE symbol = 'BRL'),
            'Limite para envio ou pagamento via PIX',
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
            'PIXWDWALCHANGE',
            (SELECT id FROM "Transaction_types" WHERE tag = 'PIXWDWALCHANGE'),
            (SELECT id FROM "Currencies" WHERE symbol = 'BRL'),
            'Limite para saque ou troco via PIX',
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
          SELECT 
            uuid_generate_v4(),
            nl.id, 
            g.daily_limit,
            g.monthly_limit,
            g.annual_limit,
            100000,
            g.max_amount,
            g.min_amount,
            g.user_daily_limit,
            g.user_monthly_limit,
            g.user_yearly_limit,
            g.user_nightly_limit,
            NOW(),
            NOW()
          FROM "Limit_types" l 
          JOIN "Global_limits" g ON g.limit_type_id = l.id
          JOIN (SELECT id FROM "Limit_types" l WHERE l.tag = 'PIXSEND') nl ON 1 = 1
          WHERE l.tag = 'TED'
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
            (SELECT id FROM "Limit_types" l WHERE l.tag = 'PIXWDWALCHANGE'), 
            50000,
            1550000,
            18300000,
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

      await queryInterface.sequelize.query(
        `
          INSERT INTO "Users_limits" (
            id,
            limit_type_id,
            user_id,
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
          SELECT
            uuid_generate_v4(),
            nl.id,
            u.user_id,
            u.daily_limit,
            u.monthly_limit,
            u.annual_limit,
            100000,
            u.max_amount,
            u.min_amount,
            u.user_daily_limit,
            u.user_monthly_limit,
            u.user_yearly_limit,
            u.user_nightly_limit,
            NOW(),
            NOW()
          FROM "Limit_types" l 
          JOIN "Users_limits" u ON u.limit_type_id = l.id
          JOIN (SELECT id FROM "Limit_types" l WHERE l.tag = 'PIXSEND') nl ON 1 = 1
          WHERE l.tag = 'TED'
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
          DELETE FROM "Users_limits" 
          USING "Limit_types"
          WHERE "Limit_types".id = "Users_limits".limit_type_id 
          and "Limit_types".tag = 'PIXSEND'`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          DELETE FROM "Global_limits" 
          USING "Limit_types"
          WHERE "Limit_types".id = "Global_limits".limit_type_id 
          and "Limit_types".tag = 'PIXWDWALCHANGE'
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          DELETE FROM "Global_limits" 
          USING "Limit_types"
          WHERE "Limit_types".id = "Global_limits".limit_type_id 
          and "Limit_types".tag = 'PIXSEND'
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          DELETE 
          FROM "Limit_types" 
          WHERE tag = 'PIXWDWALCHANGE'
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "Limit_types" 
          WHERE tag = 'PIXSEND'
        `,
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Instant billing PIX Payment account',
            tag: 'PIXSENDACC',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Instant billing PIX Payment key',
            tag: 'PIXSENDKEY',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Instant billing PIX Payment qr code static',
            tag: 'PIXSENDQRS',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Withdrawal PIX Payment qr code static',
            tag: 'PIXWITHDRAWALQRS',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Instant billing PIX Payment qr code dynamic',
            tag: 'PIXSENDQRD',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Withdrawal PIX Payment qr code dynamic',
            tag: 'PIXWITHDRAWALQRD',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Change PIX Payment qr code dynamic',
            tag: 'PIXCHANGEQRD',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Duedate PIX Payment qr code dynamic',
            tag: 'PIXDUEDATEQRD',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "Operations" 
          SET transaction_type_id = (
            SELECT id FROM "Transaction_types" WHERE tag = 'PIXWITHDRAWALQRS'
          )
          WHERE transaction_type_id IN (
            SELECT id
            FROM "Transaction_types"
            WHERE tag = 'PIXWDWALCHANGE'
          )
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "Operations" 
          SET transaction_type_id = (
            SELECT id FROM "Transaction_types" WHERE tag = 'PIXSENDACC'
          )
          WHERE transaction_type_id IN (
            SELECT id
            FROM "Transaction_types"
            WHERE tag = 'PIXSEND'
          )
        `,
        { transaction },
      );

      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXWDWALCHANGE',
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXSEND',
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
