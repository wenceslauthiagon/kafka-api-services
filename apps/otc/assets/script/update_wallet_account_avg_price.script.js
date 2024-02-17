const path = require('path');
const Sequelize = require('sequelize');
require('dotenv').config({  path: path.join(__dirname, '../../../../.otc.env') });


//This script will update wallet account avg price


const timeout = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));



(async () => {
  try {
    const sequelize = new Sequelize(
      process.env.APP_DATABASE_DATABASE,
      process.env.APP_DATABASE_USERNAME,
      process.env.APP_DATABASE_PASSWORD,
       {
          host: process.env.APP_DATABASE_HOST ?? "localhost",
          dialect: 'postgres',
          port: process.env.APP_DATABASE_PORT ?? 5432,
          logging: false,
       }
     );

    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    let rowAffectedCount = 0;
    let page = 0;
    const take = process.env.APP_SCRIPT_UPDATE_WALLET_ACCOUNT_AVG_PRICE_LIMIT_PER_PAGE ?? 100;

    do {
      console.log(`Page: ${page} - Take: ${take}`);

      const response = await sequelize.query(
        `UPDATE "Wallet_accounts" AS wa
        SET avg_price = cr.avg_price
        FROM (
          SELECT DISTINCT ON (wallet_account_id) wallet_account_id, avg_price
          FROM "crypto_reports"
          WHERE avg_price IS NOT NULL
          ORDER BY wallet_account_id, created_at DESC
          LIMIT ${take}
          OFFSET ${page * take}
        ) AS cr
        WHERE wa.uuid = cr.wallet_account_id;`
      );

      rowAffectedCount = response[1].rowCount;
      console.log('Affected rows: ', rowAffectedCount);

      await timeout(process.env.APP_SCRIPT_UPDATE_WALLET_ACCOUNT_AVG_PRICE_INTERVAL_MS ?? 10000);
      page++;

    } while (rowAffectedCount !== 0);
  } catch (error) {
    console.log(error);
  }
})();
