'use strict';

const CURRENCIES_TABLE = 'Currencies';
const GLOBAL_LIMITS_TABLE = 'Global_limits';
const LIMIT_TYPES_TABLE = 'Limit_types';
const OPERATIONS_TABLE = 'Operations';
const TRANSACTION_TYPES_TABLE = 'Transaction_types';
const USERS_LIMITS_TRACKER_TABLE = 'users_limits_tracker';
const USERS_LIMITS_TABLE = 'Users_limits';
const USERS_WALLETS_TABLE = 'users_wallets';
const WALLET_ACCOUNT_TRANSACTIONS_TABLE = 'Wallet_account_transactions';
const WALLET_ACCOUNTS_TABLE = 'Wallet_accounts';
const WALLET_INVITATIONS_TABLE = 'wallet_invitations';
const WALLETS_TABLE = 'Wallets';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CURRENCIES_TABLE,
        },
        ['tag'],
        {
          transaction,
          name: `${CURRENCIES_TABLE}_tag_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CURRENCIES_TABLE,
        },
        ['symbol'],
        {
          transaction,
          name: `${CURRENCIES_TABLE}_symbol_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CURRENCIES_TABLE,
        },
        ['state'],
        {
          transaction,
          name: `${CURRENCIES_TABLE}_state_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: GLOBAL_LIMITS_TABLE,
        },
        ['limit_type_id'],
        {
          transaction,
          name: `${GLOBAL_LIMITS_TABLE}_limit_type_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: LIMIT_TYPES_TABLE,
        },
        ['tag'],
        {
          transaction,
          name: `${LIMIT_TYPES_TABLE}_tag_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        ['owner_wallet_id', 'created_at', 'transaction_type_id', 'state'],
        {
          transaction,
          name: `${OPERATIONS_TABLE}_owner_created_transaction_state_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        ['beneficiary_wallet_id', 'created_at', 'transaction_type_id', 'state'],
        {
          transaction,
          name: `${OPERATIONS_TABLE}_beneficiary_created_transaction_state_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        [
          'owner_wallet_id',
          'beneficiary_wallet_id',
          'created_at',
          'value',
          'state',
        ],
        {
          transaction,
          name: `${OPERATIONS_TABLE}_wallets_created_value_state_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        ['owner_wallet_id', 'beneficiary_wallet_id', 'id'],
        {
          transaction,
          name: `${OPERATIONS_TABLE}_owner_wallet_id_beneficiary_wallet_id_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        ['created_at', 'chargeback'],
        { transaction, name: `${OPERATIONS_TABLE}_created_at_chargeback_key` },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        ['currency_type_id', 'created_at', 'chargeback'],
        {
          transaction,
          name: `${OPERATIONS_TABLE}_currency_type_id_created_at_chargeback_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        ['analysis_tags', 'created_at'],
        {
          transaction,
          name: `${OPERATIONS_TABLE}_analysis_tags_created_at_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: TRANSACTION_TYPES_TABLE,
        },
        ['tag'],
        {
          transaction,
          name: `${TRANSACTION_TYPES_TABLE}_tag_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: TRANSACTION_TYPES_TABLE,
        },
        ['tag', 'state'],
        {
          transaction,
          name: `${TRANSACTION_TYPES_TABLE}_tag_state_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: USERS_LIMITS_TRACKER_TABLE,
        },
        [
          'used_daily_limit',
          'used_monthly_limit',
          'used_annual_limit',
          'used_nightly_limit',
          'period_start',
        ],
        {
          transaction,
          name: `${USERS_LIMITS_TRACKER_TABLE}_daily_monthly_annual_nightly_period_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: USERS_LIMITS_TABLE,
        },
        ['user_id', 'limit_type_id'],
        {
          transaction,
          name: `${USERS_LIMITS_TABLE}_user_id_limit_type_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: USERS_LIMITS_TABLE,
        },
        ['id', 'user_id'],
        {
          transaction,
          name: `${USERS_LIMITS_TABLE}_id_user_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: USERS_WALLETS_TABLE,
        },
        ['user_id', 'wallet_id'],
        { transaction, name: `${USERS_WALLETS_TABLE}_user_id_wallet_id_key` },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: USERS_WALLETS_TABLE,
        },
        ['wallet_id'],
        {
          transaction,
          name: `${USERS_WALLETS_TABLE}_wallet_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: USERS_WALLETS_TABLE,
        },
        ['user_id'],
        {
          transaction,
          name: `${USERS_WALLETS_TABLE}_user_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_ACCOUNT_TRANSACTIONS_TABLE,
        },
        ['operation_id'],
        {
          transaction,
          name: `${WALLET_ACCOUNT_TRANSACTIONS_TABLE}_operation_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_ACCOUNTS_TABLE,
        },
        ['currency_id', 'wallet_uuid'],
        {
          transaction,
          name: `${WALLET_ACCOUNTS_TABLE}_currency_id_wallet_uuid_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_ACCOUNTS_TABLE,
        },
        ['currency_id', 'wallet_id'],
        {
          transaction,
          name: `${WALLET_ACCOUNTS_TABLE}_currency_id_wallet_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_ACCOUNTS_TABLE,
        },
        ['currency_id', 'account_number'],
        {
          transaction,
          name: `${WALLET_ACCOUNTS_TABLE}_currency_id_account_number_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_ACCOUNTS_TABLE,
        },
        ['wallet_uuid'],
        {
          transaction,
          name: `${WALLET_ACCOUNTS_TABLE}_wallet_uuid_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_ACCOUNTS_TABLE,
        },
        ['uuid', 'wallet_uuid'],
        { transaction, name: `${WALLET_ACCOUNTS_TABLE}_uuid_wallet_uuid_key` },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_INVITATIONS_TABLE,
        },
        ['id', 'user_id'],
        { transaction, name: `${WALLET_INVITATIONS_TABLE}_id_user_id_key` },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_INVITATIONS_TABLE,
        },
        [
          'user_id',
          'state',
          'accepted_at',
          'declined_at',
          'created_at',
          'expired_at',
        ],
        {
          transaction,
          name: `${WALLET_INVITATIONS_TABLE}_user_state_dates_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_INVITATIONS_TABLE,
        },
        ['state', 'email', 'accepted_at', 'declined_at', 'created_at'],
        {
          transaction,
          name: `${WALLET_INVITATIONS_TABLE}_state_email_accepted_declined_created_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_INVITATIONS_TABLE,
        },
        ['email', 'wallet_id', 'state'],
        {
          transaction,
          name: `${WALLET_INVITATIONS_TABLE}_email_wallet_id_state_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_INVITATIONS_TABLE,
        },
        ['expired_at', 'state'],
        {
          transaction,
          name: `${WALLET_INVITATIONS_TABLE}_expired_at_state_key`,
        },
      );
      await queryInterface.addIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: WALLETS_TABLE },
        ['uuid'],
        {
          transaction,
          name: `${WALLETS_TABLE}_uuid_key`,
        },
      );
      await queryInterface.addIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: WALLETS_TABLE },
        ['user_uuid', 'state'],
        {
          transaction,
          name: `${WALLETS_TABLE}_user_uuid_state_key`,
        },
      );
      await queryInterface.addIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: WALLETS_TABLE },
        ['user_uuid', 'default'],
        {
          transaction,
          name: `${WALLETS_TABLE}_user_uuid_default_key`,
        },
      );
      await queryInterface.addIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: WALLETS_TABLE },
        ['user_uuid'],
        {
          transaction,
          name: `${WALLETS_TABLE}_user_uuid_key`,
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
          tableName: CURRENCIES_TABLE,
        },
        `${CURRENCIES_TABLE}_tag_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CURRENCIES_TABLE,
        },
        `${CURRENCIES_TABLE}_symbol_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CURRENCIES_TABLE,
        },
        `${CURRENCIES_TABLE}_state_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: GLOBAL_LIMITS_TABLE,
        },
        `${GLOBAL_LIMITS_TABLE}_limit_type_id_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: LIMIT_TYPES_TABLE,
        },
        `${LIMIT_TYPES_TABLE}_tag_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        `${OPERATIONS_TABLE}_owner_created_transaction_state_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        `${OPERATIONS_TABLE}_beneficiary_created_transaction_state_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        `${OPERATIONS_TABLE}_wallets_created_value_state_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        `${OPERATIONS_TABLE}_owner_wallet_id_beneficiary_wallet_id_id_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        `${OPERATIONS_TABLE}_created_at_chargeback_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        `${OPERATIONS_TABLE}_currency_type_id_created_at_chargeback_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: OPERATIONS_TABLE,
        },
        `${OPERATIONS_TABLE}_analysis_tags_created_at_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: TRANSACTION_TYPES_TABLE,
        },
        `${TRANSACTION_TYPES_TABLE}_tag_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: TRANSACTION_TYPES_TABLE,
        },
        `${TRANSACTION_TYPES_TABLE}_tag_state_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: USERS_LIMITS_TRACKER_TABLE,
        },
        `${USERS_LIMITS_TRACKER_TABLE}_daily_monthly_annual_nightly_period_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: USERS_LIMITS_TABLE,
        },
        `${USERS_LIMITS_TABLE}_user_id_limit_type_id_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: USERS_LIMITS_TABLE,
        },
        `${USERS_LIMITS_TABLE}_id_user_id_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: USERS_WALLETS_TABLE,
        },
        `${USERS_WALLETS_TABLE}_user_id_wallet_id_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: USERS_WALLETS_TABLE,
        },
        `${USERS_WALLETS_TABLE}_wallet_id_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: USERS_WALLETS_TABLE,
        },
        `${USERS_WALLETS_TABLE}_user_id_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_ACCOUNT_TRANSACTIONS_TABLE,
        },
        `${WALLET_ACCOUNT_TRANSACTIONS_TABLE}_operation_id_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_ACCOUNTS_TABLE,
        },
        `${WALLET_ACCOUNTS_TABLE}_currency_id_wallet_uuid_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_ACCOUNTS_TABLE,
        },
        `${WALLET_ACCOUNTS_TABLE}_currency_id_wallet_id_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_ACCOUNTS_TABLE,
        },
        `${WALLET_ACCOUNTS_TABLE}_currency_id_account_number_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_ACCOUNTS_TABLE,
        },
        `${WALLET_ACCOUNTS_TABLE}_wallet_uuid_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_ACCOUNTS_TABLE,
        },
        `${WALLET_ACCOUNTS_TABLE}_uuid_wallet_uuid_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_INVITATIONS_TABLE,
        },
        `${WALLET_INVITATIONS_TABLE}_id_user_id_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_INVITATIONS_TABLE,
        },
        `${WALLET_INVITATIONS_TABLE}_user_state_dates_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_INVITATIONS_TABLE,
        },
        `${WALLET_INVITATIONS_TABLE}_state_email_accepted_declined_created_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_INVITATIONS_TABLE,
        },
        `${WALLET_INVITATIONS_TABLE}_email_wallet_id_state_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: WALLET_INVITATIONS_TABLE,
        },
        `${WALLET_INVITATIONS_TABLE}_expired_at_state_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: WALLETS_TABLE },
        `${WALLETS_TABLE}_uuid_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: WALLETS_TABLE },
        `${WALLETS_TABLE}_user_uuid_state_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: WALLETS_TABLE },
        `${WALLETS_TABLE}_user_uuid_default_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: WALLETS_TABLE },
        `${WALLETS_TABLE}_user_uuid_key`,
        {
          transaction,
        },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
