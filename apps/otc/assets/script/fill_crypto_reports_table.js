const path = require('path');
const Sequelize = require('sequelize');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({
  path: path.join(__dirname, '../../../../.otc.env'),
});

const TAKE = process.env.APP_SCRIPT_FILL_CRYPTO_REPORTS_LIMIT_PER_PAGE ?? 100;
const INTERVAL_MS =
  process.env.APP_SCRIPT_FILL_CRYPTO_REPORTS_INTERVAL_MS ?? 10000;

const timeout = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const insertIntoCryptoReports = async (sequelize, reports) => {
  console.log('Insert into crypto reports');

  const [_, affectedRows] = await sequelize.query(
    `
    INSERT INTO "crypto_reports" (
      id,
      operation_id,
      type,
      crypto_amount,
      crypto_price,
      accurate_price,
      fiat_amount,
      avg_price,
      crypto_balance,
      loss,
      profit,
      profit_loss_percentage,
      user_id,
      crypto_id,
      conversion_id,
      operation_btc_receive_id,
      wallet_account_id,
      wallet_id,
      created_at,
      updated_at
    )
    VALUES
      ${reports
        .map(() => `(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .join(',')}
  `,
    {
      logging: false,
      replacements: Object.values(reports)
        .map((report) => [uuidv4(), ...Object.values(report)])
        .flat(),
      type: sequelize.QueryTypes.INSERT,
    },
  );

  console.log(`Inserted ${affectedRows} rows`);

  await timeout(INTERVAL_MS);
};

const getCryptoReportsReceivedInOperation = async (sequelize, take = 100) => {
  console.log('Get received crypto reports in Operation Table');

  let reports;
  let goOn = true;
  let page = 0;

  while (goOn) {
    const response = await sequelize.query(`
        SELECT
          o.id                                                   as operation_id,
          'withdraw'                                             as type,
          o.value                                                as crypto_amount,
          NULL                                                   as crypto_price,
          NULL                                                   as accurate_price,
          NULL                                                   as fiat_amount,
          NULL                                                   as avg_price,
          NULL                                                   as crypto_balance,
          NULL                                                   as loss,
          NULL                                                   as profit,
          NULL                                                   as profit_loss_percentage,
          u.uuid                                                 as user_id,
          o.currency_type_id                                     as crypto_id,
          NULL                                                   as conversion_id,
          NULL                                                   as operation_btc_receive_id,
          wa.uuid                                                as wallet_account_id,
          wa.wallet_uuid                                         as wallet_id,
          o.created_at                                           as created_at,
          o.updated_at                                           as updated_at
        FROM
          "Operations" o
            JOIN "Users" u   ON u.id = o.owner_id
            JOIN "Wallet_accounts" wa ON o.owner_wallet_id = wa.id
        WHERE
          o.transaction_type_id = 6
          AND
          o.state = 'accepted'
        ORDER BY
          o.created_at
        LIMIT ${take}
        OFFSET ${page * take}
      `);

    console.log(`Page: ${page} - Take: ${response[1].rows.length}`);

    reports = response[1].rows;

    reports.length > 0
      ? await insertIntoCryptoReports(sequelize, reports)
      : (goOn = false);

    reports = [];
    page++;
  }
};

const getCryptoReportsReceivedInBtcReceives = async (sequelize, take = 100) => {
  console.log('Get received crypto reports in Btc Receives Table');

  let reports;
  let goOn = true;
  let page = 0;

  while (goOn) {
    const response = await sequelize.query(`
      SELECT
        NULL                                                   as operation_id,
        'deposit'                                              as type,
        obr.value                                              as crypto_amount,
        CASE
          WHEN obr.usd_received_quote <> 0 AND obr.btc_received_quote <> 0 
            THEN CAST((obr.usd_received_quote * (obr.btc_received_quote)/10.^2) AS int)
          ELSE NULL
        END                                                    as crypto_price,
        false                                                  as accurate_price,
        CASE
          WHEN obr.usd_received_quote <> 0 AND obr.btc_received_quote <> 0 
            THEN CAST(((obr.value /10.^ 8) * obr.usd_received_quote * (obr.btc_received_quote)/10.^2) AS int)
            ELSE NULL
        END                                                    as fiat_amount,
        NULL                                                   as avg_price,
        NULL                                                   as crypto_balance,
        NULL                                                   as loss,
        NULL                                                   as profit,
        NULL                                                   as profit_loss_percentage,
        u.uuid                                                 as user_id,
        obr.currency_type_id                                   as crypto_id,
        CAST(NULL AS uuid)                                     as conversion_id,
        CAST(obr.id AS uuid)                                   as operation_btc_receive_id,
        wa.uuid                                                as wallet_account_id,
        wa.wallet_uuid                                         as wallet_id,
        obr.created_at                                         as created_at,
        obr.updated_at                                         as updated_at
      FROM
        "Operations_btc_receives" obr
        JOIN "Currencies" cur ON obr.currency_type_id = cur.id
        JOIN "Users" u ON obr.beneficiary_id = u.id
        JOIN "Wallet_accounts" wa ON obr.beneficiary_wallet_id = wa.id
      WHERE
        obr.state = 'accepted'
      ORDER BY
        obr.created_at
      LIMIT ${take}
      OFFSET ${page * take}
    `);

    console.log(`Page: ${page} - Take: ${response[1].rows.length}`);

    reports = response[1].rows;

    reports.length > 0
      ? await insertIntoCryptoReports(sequelize, reports)
      : (goOn = false);

    reports = [];
    page++;
  }
};

const getCryptoReportsCashBackAndReferralRewardInConversion = async (
  sequelize,
  take = 100,
) => {
  console.log(
    'Get cashback and referral reward crypto reports in Conversion Table',
  );

  let reports;
  let goOn = true;
  let page = 0;

  while (goOn) {
    const response = await sequelize.query(`
      SELECT
        o.id                                                      as operation_id,
        'cashback'                                                as type,
        o.value                                                   as crypto_amount,
        CAST((c.usd_quote*(CAST(c.btc_quote AS numeric))) AS int) as crypto_price,            
        false                                                     as accurate_price,
        CAST((c.btc_amount/10^cur.decimal) * (c.usd_quote*(CAST(c.btc_quote AS numeric))) AS int) as fiat_amount,
        NULL                                                      as avg_price,
        NULL                                                      as crypto_balance,
        NULL                                                      as loss,
        NULL                                                      as profit,
        NULL                                                      as profit_loss_percentage,
        u.uuid                                                    as user_id,
        o.currency_type_id                                        as crypto_id,
        c.id                                                      as conversion_id,
        NULL                                                      as operation_btc_receive_id,
        wa.uuid                                                   as wallet_account_id,
        wa.wallet_uuid                                            as wallet_id,
        o.created_at                                              as created_at,
        o.updated_at                                              as updated_at
      FROM
        "Conversions" c
        JOIN "Operations" o       ON c.operation_id = o.id
        JOIN "Currencies" cur      ON o.currency_type_id = cur.id
        JOIN "Wallet_accounts" wa ON o.beneficiary_wallet_id = wa.id
        JOIN "Users" u ON o.beneficiary_id = u.id
      WHERE
        o.transaction_type_id in (29,35)
        AND o.state = 'accepted'
      ORDER BY
          c.created_at
      LIMIT ${take}
      OFFSET ${page * take}
    `);

    console.log(`Page: ${page} - Take: ${response[1].rows.length}`);

    reports = response[1].rows;

    reports.length > 0
      ? await insertIntoCryptoReports(sequelize, reports)
      : (goOn = false);

    reports = [];
    page++;
  }
};

const getCryptoReportsConversionInConversion = async (
  sequelize,
  take = 100,
) => {
  console.log('Get conversion crypto reports in Conversion Table');

  let reports;
  let goOn = true;
  let page = 0;

  while (goOn) {
    const response = await sequelize.query(`
      SELECT
        operation_id,
        x.type,
        crypto_amount,
        crypto_price,
        x.accurate_price,
        fiat_amount,
        x.avg_price,
        crypto_balance,
        profit,
        loss,
        profit_loss_percentage,
        u.uuid as user_id,
        x.crypto_id,
        CAST(conversion_id AS uuid),
        CAST(operation_btc_receive_id AS uuid),
        wa.uuid as wallet_account_id,
        wa.wallet_uuid as wallet_id,
        x.created_at,
        x.updated_at
      FROM
        (
        SELECT
          o1.id                                               as operation_id,
          c.conversion_type                                   as type,
          o1.value                                            as crypto_amount,
          CAST(((o2.value)/(o1.value/10^cur.decimal)) AS int) as crypto_price,
          true                                                as accurate_price,
          o2.value                                            as fiat_amount,
          NULL                                                as avg_price,
          NULL                                                as crypto_balance,
          NULL                                                as profit,
          NULL                                                as loss,
          NULL                                                as profit_loss_percentage,
          CASE
              WHEN o1.owner_id <> 0 AND o1.beneficiary_id = 0 THEN o1.owner_id
              ELSE o1.beneficiary_id
          END                                                as user_id,
          o1.currency_type_id                                as crypto_id,
          c.id                                               as conversion_id,
          NULL                                               as operation_btc_receive_id,
          CASE
              WHEN o1.owner_wallet_id <> 0 AND o1.beneficiary_wallet_id = 0 THEN o1.owner_wallet_id
              ELSE o1.beneficiary_wallet_id
          END                                                as wallet_account_id,
          o1.created_at                                      as created_at,
          o1.updated_at                                      as updated_at
        FROM
          "Conversions" c
          JOIN "Operations" o1      ON c.operation_id = o1.id
          JOIN "Currencies" cur      ON o1.currency_type_id = cur.id
          JOIN "Operations" o2      ON o1.operation_ref_id = o2.id
        WHERE
          o1.transaction_type_id = 13
          AND o1.state = 'accepted'
        ORDER BY
          c.created_at
        )x
      JOIN
          "Wallet_accounts" wa ON x.wallet_account_id = wa.id
      JOIN
          "Users" u ON x.user_id = u.id
      LIMIT ${take}
      OFFSET ${page * take}
    `);

    console.log(`Page: ${page} - Take: ${response[1].rows.length}`);

    reports = response[1].rows;

    reports.length > 0
      ? await insertIntoCryptoReports(sequelize, reports)
      : (goOn = false);

    reports = [];
    page++;
  }
};

const getCryptoReportsWithdrawP2PInOperations = async (
  sequelize,
  take = 100,
) => {
  console.log('Get withdraw p2p crypto reports in Operation Table');

  let reports;
  let goOn = true;
  let page = 0;

  while (goOn) {
    const response = await sequelize.query(`
      SELECT
        o.id                                                    as operation_id,
        'withdraw'                                              as type,
        o.value                                                 as crypto_amount,
        NULL                                                    as crypto_price,
        NULL                                                    as accurate_price,
        NULL                                                    as fiat_amount,
        NULL                                                    as avg_price,
        NULL                                                    as crypto_balance,
        NULL                                                    as loss,
        NULL                                                    as profit,
        NULL                                                    as profit_loss_percentage,
        u.uuid                                                  as user_id,
        o.currency_type_id                                      as crypto_id,
        NULL                                                    as conversion_id,
        NULL                                                    as operation_btc_receive_id,
        wa.uuid                                                 as wallet_account_id,
        wa.wallet_uuid                                          as wallet_id,
        o.created_at                                            as created_at,
        o.updated_at                                            as updated_at
      FROM
        "Operations" o
          JOIN "Users" u   ON u.id = o.owner_id
          JOIN "Wallet_accounts" wa ON o.owner_wallet_id = wa.id
      WHERE
        o.transaction_type_id = 8
        AND
        o.state = 'accepted'
      ORDER BY
          o.created_at
      LIMIT ${take}
      OFFSET ${page * take}
    `);

    console.log(`Page: ${page} - Take: ${response[1].rows.length}`);

    reports = response[1].rows;

    reports.length > 0
      ? await insertIntoCryptoReports(sequelize, reports)
      : (goOn = false);

    reports = [];
    page++;
  }
};

const getCryptoReportsDepositP2PInOperations = async (
  sequelize,
  take = 100,
) => {
  console.log('Get deposit p2p crypto reports in Operation Table');

  let reports;
  let goOn = true;
  let page = 0;

  while (goOn) {
    const response = await sequelize.query(`
      SELECT
        o.id                                                    as operation_id,
        'deposit'                                               as type,
        o.value                                                 as crypto_amount,
        NULL                                                    as crypto_price,
        NULL                                                    as accurate_price,
        NULL                                                    as fiat_amount,
        NULL                                                    as avg_price,
        NULL                                                    as crypto_balance,
        NULL                                                    as loss,
        NULL                                                    as profit,
        NULL                                                    as profit_loss_percentage,
        u.uuid                                                  as user_id,
        o.currency_type_id                                      as crypto_id,
        NULL                                                    as conversion_id,
        NULL                                                    as operation_btc_receive_id,
        wa.uuid                                                 as wallet_account_id,
        wa.wallet_uuid                                          as wallet_id,
        o.created_at                                            as created_at,
        o.updated_at                                            as updated_at
      FROM
        "Operations" o
          JOIN "Users" u   ON u.id = o.beneficiary_id
          JOIN "Wallet_accounts" wa ON o.beneficiary_wallet_id = wa.id
      WHERE
        o.transaction_type_id = 8
        AND
        o.state = 'accepted'
      ORDER BY
        o.created_at
      LIMIT ${take}
      OFFSET ${page * take}
    `);

    console.log(`Page: ${page} - Take: ${response[1].rows.length}`);

    reports = response[1].rows;

    reports.length > 0
      ? await insertIntoCryptoReports(sequelize, reports)
      : (goOn = false);

    reports = [];
    page++;
  }
};

const getCryptoReportsWithdrawChatP2PInOperations = async (
  sequelize,
  take = 100,
) => {
  console.log('Get withdraw chat p2p crypto reports in Operation Table');

  let reports;
  let goOn = true;
  let page = 0;

  while (goOn) {
    const response = await sequelize.query(`
      SELECT
        o.id                                                   as operation_id,
        'withdraw'                                             as type,
        o.value                                                as crypto_amount,
        NULL                                                   as crypto_price,
        NULL                                                   as accurate_price,
        NULL                                                   as fiat_amount,
        NULL                                                   as avg_price,
        NULL                                                   as crypto_balance,
        NULL                                                   as loss,
        NULL                                                   as profit,
        NULL                                                   as profit_loss_percentage,
        u.uuid                                                 as user_id,
        o.currency_type_id                                     as crypto_id,
        NULL                                                   as conversion_id,
        NULL                                                   as operation_btc_receive_id,
        wa.uuid                                                as wallet_account_id,
        wa.wallet_uuid                                         as wallet_id,
        o.created_at                                           as created_at,
        o.updated_at                                           as updated_at
      FROM
        "Operations" o
          JOIN "Users" u   ON u.id = o.owner_id
          JOIN "Wallet_accounts" wa ON o.owner_wallet_id = wa.id
      WHERE
        o.transaction_type_id = 1
        AND
        o.currency_type_id = 2
        AND
        o.state = 'accepted'
      ORDER BY
        o.created_at
      LIMIT ${take}
      OFFSET ${page * take}
    `);

    console.log(`Page: ${page} - Take: ${response[1].rows.length}`);

    reports = response[1].rows;

    reports.length > 0
      ? await insertIntoCryptoReports(sequelize, reports)
      : (goOn = false);

    reports = [];
    page++;
  }
};

const getCryptoReportsDepositChatP2PInOperations = async (
  sequelize,
  take = 100,
) => {
  console.log('Get deposit chat p2p crypto reports in Operation Table');

  let reports;
  let goOn = true;
  let page = 0;

  while (goOn) {
    const response = await sequelize.query(`
      SELECT
        o.id                                                   as operation_id,
        'deposit'                                              as type,
        o.value                                                as crypto_amount,
        NULL                                                   as crypto_price,
        NULL                                                   as accurate_price,
        NULL                                                   as fiat_amount,
        NULL                                                   as avg_price,
        NULL                                                   as crypto_balance,
        NULL                                                   as loss,
        NULL                                                   as profit,
        NULL                                                   as profit_loss_percentage,
        u.uuid                                                 as user_id,
        o.currency_type_id                                     as crypto_id,
        NULL                                                   as conversion_id,
        NULL                                                   as operation_btc_receive_id,
        wa.uuid                                                as wallet_account_id,
        wa.wallet_uuid                                         as wallet_id,
        o.created_at                                           as created_at,
        o.updated_at                                           as updated_at
      FROM
        "Operations" o
          JOIN "Users" u   ON u.id = o.beneficiary_id
          JOIN "Wallet_accounts" wa ON o.beneficiary_wallet_id = wa.id
      WHERE
        o.transaction_type_id = 1
        AND
        o.currency_type_id = 2
        AND
        o.state = 'accepted'
      ORDER BY
        o.created_at
      LIMIT ${take}
      OFFSET ${page * take}
    `);

    console.log(`Page: ${page} - Take: ${response[1].rows.length}`);

    reports = response[1].rows;

    reports.length > 0
      ? await insertIntoCryptoReports(sequelize, reports)
      : (goOn = false);

    reports = [];
    page++;
  }
};

(async () => {
  try {
    const sequelize = new Sequelize(
      process.env.APP_DATABASE_DATABASE,
      process.env.APP_DATABASE_USERNAME,
      process.env.APP_DATABASE_PASSWORD,
      {
        host: process.env.APP_DATABASE_HOST ?? 'localhost',
        dialect: 'postgres',
        port: process.env.APP_DATABASE_PORT ?? 5432,
        logging: false,
      },
    );

    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    console.log('-------');
    await getCryptoReportsReceivedInOperation(sequelize, TAKE);
    console.log('-------');
    await getCryptoReportsReceivedInBtcReceives(sequelize, TAKE);
    console.log('-------');
    await getCryptoReportsCashBackAndReferralRewardInConversion(
      sequelize,
      TAKE,
    );
    console.log('-------');
    await getCryptoReportsConversionInConversion(sequelize, TAKE);
    console.log('-------');
    await getCryptoReportsWithdrawP2PInOperations(sequelize, TAKE);
    console.log('-------');
    await getCryptoReportsDepositP2PInOperations(sequelize, TAKE);
    console.log('-------');
    await getCryptoReportsWithdrawChatP2PInOperations(sequelize, TAKE);
    console.log('-------');
    await getCryptoReportsDepositChatP2PInOperations(sequelize, TAKE);
  } catch (error) {
    console.log(error);
  }
})();
