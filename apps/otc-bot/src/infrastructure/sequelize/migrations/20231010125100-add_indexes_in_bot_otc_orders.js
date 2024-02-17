'use strict';

const BOT_OTC_ORDERS_TABLE = 'bot_otc_orders';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: BOT_OTC_ORDERS_TABLE,
        },
        ['bot_otc_id', 'state'],
        { transaction, name: `${BOT_OTC_ORDERS_TABLE}_bot_otc_id_state_key` },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: BOT_OTC_ORDERS_TABLE,
        },
        ['state', 'created_at'],
        { transaction, name: `${BOT_OTC_ORDERS_TABLE}_state_created_at_key` },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: BOT_OTC_ORDERS_TABLE,
        },
        ['state'],
        {
          transaction,
          name: `${BOT_OTC_ORDERS_TABLE}_state_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: BOT_OTC_ORDERS_TABLE,
        },
        ['buy_order_id'],
        {
          transaction,
          name: `${BOT_OTC_ORDERS_TABLE}_buy_order_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: BOT_OTC_ORDERS_TABLE,
        },
        ['bot_otc_id', 'state', 'created_at'],
        {
          transaction,
          name: `${BOT_OTC_ORDERS_TABLE}_bot_otc_id_state_created_at_key`,
        },
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
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: BOT_OTC_ORDERS_TABLE,
        },
        `${BOT_OTC_ORDERS_TABLE}_bot_otc_id_state_key`,
        { transaction },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: BOT_OTC_ORDERS_TABLE,
        },
        `${BOT_OTC_ORDERS_TABLE}_state_created_at_key`,
        { transaction },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: BOT_OTC_ORDERS_TABLE,
        },
        `${BOT_OTC_ORDERS_TABLE}_state_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: BOT_OTC_ORDERS_TABLE,
        },
        `${BOT_OTC_ORDERS_TABLE}_buy_order_id_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: BOT_OTC_ORDERS_TABLE,
        },
        `${BOT_OTC_ORDERS_TABLE}_bot_otc_id_state_created_at_key`,
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
