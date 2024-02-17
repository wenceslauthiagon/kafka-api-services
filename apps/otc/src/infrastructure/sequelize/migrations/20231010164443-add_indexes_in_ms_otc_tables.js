'use strict';

const CONVERSIONS_TABLE = 'Conversions';
const CRYPTO_ORDERS_TABLE = 'crypto_orders';
const CRYPTO_REPORTS_TABLE = 'crypto_reports';
const EXCHANGE_CONTRACTS_TABLE = 'exchange_contracts';
const EXCHANGE_QUOTATIONS_TABLE = 'exchange_quotations';
const HOLIDAYS_TABLE = 'holidays';
const REMITTANCE_EXCHANGE_QUOTATIONS_TABLE = 'remittance_exchange_quotations';
const REMITTANCE_ORDERS_REMITTANCES_TABLE = 'remittance_orders_remittances';
const REMITTANCE_ORDERS_TABLE = 'remittance_orders';
const REMITTANCES_TABLE = 'Remittances';
const SPREADS_TABLE = 'spreads';
const TAXES_TABLE = 'taxes';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CONVERSIONS_TABLE,
        },
        ['id', 'user_uuid'],
        {
          transaction,
          name: `${CONVERSIONS_TABLE}_id_user_uuid_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CONVERSIONS_TABLE,
        },
        ['operation_id'],
        {
          transaction,
          name: `${CONVERSIONS_TABLE}_operation_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CONVERSIONS_TABLE,
        },
        ['user_uuid', 'operation_id'],
        {
          transaction,
          name: `${CONVERSIONS_TABLE}_user_uuid_operation_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CONVERSIONS_TABLE,
        },
        [
          'user_uuid',
          'operation_id',
          'quotation_id',
          'currency_id',
          'conversion_type',
          'client_name',
          'client_document',
          'created_at',
        ],
        {
          transaction,
          name: `${CONVERSIONS_TABLE}_user_op_quotation_currency_client_created_key`,
        },
      );

      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CRYPTO_ORDERS_TABLE,
        },
        ['state'],
        {
          transaction,
          name: `${CRYPTO_ORDERS_TABLE}_state_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CRYPTO_ORDERS_TABLE,
        },
        ['base_currency_id', 'state'],
        {
          transaction,
          name: `${CRYPTO_ORDERS_TABLE}_base_currency_id_state_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CRYPTO_ORDERS_TABLE,
        },
        ['base_currency_id', 'state', 'type'],
        {
          transaction,
          name: `${CRYPTO_ORDERS_TABLE}_base_currency_id_state_type_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CRYPTO_ORDERS_TABLE,
        },
        ['crypto_remittance_id'],
        {
          transaction,
          name: `${CRYPTO_ORDERS_TABLE}_crypto_remittance_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CRYPTO_REPORTS_TABLE,
        },
        ['crypto_id', 'user_id', 'created_at'],
        {
          transaction,
          name: `${CRYPTO_REPORTS_TABLE}_crypto_id_user_created_at_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CRYPTO_REPORTS_TABLE,
        },
        ['created_at'],
        {
          transaction,
          name: `${CRYPTO_REPORTS_TABLE}_created_at_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: EXCHANGE_CONTRACTS_TABLE,
        },
        ['file_id'],
        {
          transaction,
          name: `${EXCHANGE_CONTRACTS_TABLE}_file_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: EXCHANGE_CONTRACTS_TABLE,
        },
        [
          'contract_number',
          'id',
          'vet_quote',
          'contract_quote',
          'total_amount',
          'created_at',
        ],
        {
          transaction,
          name: `${EXCHANGE_CONTRACTS_TABLE}_contract_info_id_vet_amount_created_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: EXCHANGE_QUOTATIONS_TABLE,
        },
        ['solicitation_psp_id'],
        {
          transaction,
          name: `${EXCHANGE_QUOTATIONS_TABLE}_solicitation_psp_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: EXCHANGE_QUOTATIONS_TABLE,
        },
        ['state'],
        {
          transaction,
          name: `${EXCHANGE_QUOTATIONS_TABLE}_state_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: EXCHANGE_QUOTATIONS_TABLE,
        },
        [
          'quotation',
          'state',
          'solicitation_psp_id',
          'gateway_name',
          'created_at',
        ],
        {
          transaction,
          name: `${EXCHANGE_QUOTATIONS_TABLE}_quotation_state_solic_gateway_created_key`,
        },
      );

      await queryInterface.addIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: HOLIDAYS_TABLE },
        ['level', 'start_date', 'end_date'],
        {
          transaction,
          name: `${HOLIDAYS_TABLE}_level_start_date_end_date_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: REMITTANCE_EXCHANGE_QUOTATIONS_TABLE,
        },
        ['remittance_id', 'exchange_quotation_id'],
        {
          transaction,
          name: `${REMITTANCE_EXCHANGE_QUOTATIONS_TABLE}_remittance_exchange_quot_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: REMITTANCE_EXCHANGE_QUOTATIONS_TABLE,
        },
        ['remittance_id'],
        {
          transaction,
          name: `${REMITTANCE_EXCHANGE_QUOTATIONS_TABLE}_remittance_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: REMITTANCE_EXCHANGE_QUOTATIONS_TABLE,
        },
        ['exchange_quotation_id'],
        {
          transaction,
          name: `${REMITTANCE_EXCHANGE_QUOTATIONS_TABLE}_exchange_quotation_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: REMITTANCE_ORDERS_REMITTANCES_TABLE,
        },
        ['remittance_id'],
        {
          transaction,
          name: `${REMITTANCE_ORDERS_REMITTANCES_TABLE}_remittance_id_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: REMITTANCE_ORDERS_TABLE,
        },
        ['status'],
        {
          transaction,
          name: `${REMITTANCE_ORDERS_TABLE}_status_key`,
        },
      );
      await queryInterface.addIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: REMITTANCES_TABLE,
        },
        ['status'],
        {
          transaction,
          name: `${REMITTANCES_TABLE}_status_key`,
        },
      );
      await queryInterface.addIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: SPREADS_TABLE },
        ['currency_id'],
        {
          transaction,
          name: `${SPREADS_TABLE}_currency_id_key`,
        },
      );
      await queryInterface.addIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: SPREADS_TABLE },
        ['user_id', 'currency_symbol'],
        { transaction, name: `${SPREADS_TABLE}_user_id_currency_symbol_key` },
      );
      await queryInterface.addIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: TAXES_TABLE },
        ['name'],
        {
          transaction,
          name: `${TAXES_TABLE}_name_key`,
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
          tableName: CONVERSIONS_TABLE,
        },
        `${CONVERSIONS_TABLE}_id_user_uuid_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CONVERSIONS_TABLE,
        },
        `${CONVERSIONS_TABLE}_operation_id_key`,
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CONVERSIONS_TABLE,
        },
        `${CONVERSIONS_TABLE}_user_uuid_operation_id_key`,
        { transaction },
      );
      await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CONVERSIONS_TABLE,
        },
        `${CONVERSIONS_TABLE}_user_op_quotation_currency_client_created_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CRYPTO_ORDERS_TABLE,
        },
        `${CRYPTO_ORDERS_TABLE}_state_key`,
        {
          transaction,
        },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CRYPTO_ORDERS_TABLE,
        },
        `${CRYPTO_ORDERS_TABLE}_base_currency_id_state_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CRYPTO_ORDERS_TABLE,
        },
        `${CRYPTO_ORDERS_TABLE}_base_currency_id_state_type_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CRYPTO_ORDERS_TABLE,
        },
        `${CRYPTO_ORDERS_TABLE}_crypto_remittance_id_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CRYPTO_REPORTS_TABLE,
        },
        `${CRYPTO_REPORTS_TABLE}_crypto_id_user_created_at_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: CRYPTO_REPORTS_TABLE,
        },
        `${CRYPTO_REPORTS_TABLE}_created_at_key`,
        {
          transaction,
        },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: EXCHANGE_CONTRACTS_TABLE,
        },
        `${EXCHANGE_CONTRACTS_TABLE}_file_id_key`,
        {
          transaction,
        },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: EXCHANGE_CONTRACTS_TABLE,
        },
        `${EXCHANGE_CONTRACTS_TABLE}_contract_info_id_vet_amount_created_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: EXCHANGE_QUOTATIONS_TABLE,
        },
        `${EXCHANGE_QUOTATIONS_TABLE}_solicitation_psp_id_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: EXCHANGE_QUOTATIONS_TABLE,
        },
        `${EXCHANGE_QUOTATIONS_TABLE}_state_key`,
        {
          transaction,
        },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: EXCHANGE_QUOTATIONS_TABLE,
        },
        `${EXCHANGE_QUOTATIONS_TABLE}_quotation_state_solic_gateway_created_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: HOLIDAYS_TABLE },
        `${HOLIDAYS_TABLE}_level_start_date_end_date_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: REMITTANCE_EXCHANGE_QUOTATIONS_TABLE,
        },
        `${REMITTANCE_EXCHANGE_QUOTATIONS_TABLE}_remittance_exchange_quot_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: REMITTANCE_EXCHANGE_QUOTATIONS_TABLE,
        },
        `${REMITTANCE_EXCHANGE_QUOTATIONS_TABLE}_remittance_id_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: REMITTANCE_EXCHANGE_QUOTATIONS_TABLE,
        },
        `${REMITTANCE_EXCHANGE_QUOTATIONS_TABLE}_exchange_quotation_id_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: REMITTANCE_ORDERS_REMITTANCES_TABLE,
        },
        `${REMITTANCE_ORDERS_REMITTANCES_TABLE}_remittance_id_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: REMITTANCE_ORDERS_TABLE,
        },
        `${REMITTANCE_ORDERS_TABLE}_status_key`,
        {
          transaction,
        },
      );
      await await queryInterface.removeIndex(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: REMITTANCES_TABLE,
        },
        `${REMITTANCES_TABLE}_status_key`,
        {
          transaction,
        },
      );
      await await queryInterface.removeIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: SPREADS_TABLE },
        `${SPREADS_TABLE}_currency_id_key`,
        {
          transaction,
        },
      );
      await await queryInterface.removeIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: SPREADS_TABLE },
        `${SPREADS_TABLE}_user_id_currency_symbol_key`,
        { transaction },
      );
      await await queryInterface.removeIndex(
        { schema: process.env.APP_DATABASE_SCHEMA, tableName: TAXES_TABLE },
        `${TAXES_TABLE}_name_key`,
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
