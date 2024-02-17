'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'bot_otc_orders',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            allowNull: false,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          state: {
            field: 'state',
            type: Sequelize.STRING,
            allowNull: false,
          },
          botOtcId: {
            field: 'bot_otc_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          baseCurrencyId: {
            field: 'base_currency_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          baseCurrencySymbol: {
            field: 'base_currency_symbol',
            type: Sequelize.STRING,
            allowNull: false,
          },
          baseCurrencyDecimal: {
            field: 'base_currency_decimal',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          baseCurrencyType: {
            field: 'base_currency_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          quoteCurrencyId: {
            field: 'quote_currency_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          quoteCurrencySymbol: {
            field: 'quote_currency_symbol',
            type: Sequelize.STRING,
            allowNull: false,
          },
          quoteCurrencyDecimal: {
            field: 'quote_currency_decimal',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          quoteCurrencyType: {
            field: 'quote_currency_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          marketName: {
            field: 'market_name',
            type: Sequelize.STRING,
            allowNull: false,
          },
          market: {
            field: 'market',
            type: Sequelize.JSONB,
            allowNull: false,
          },
          amount: {
            field: 'amount',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          type: {
            field: 'type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          sellStatus: {
            field: 'sell_status',
            type: Sequelize.STRING,
            allowNull: false,
          },
          sellPrice: {
            field: 'sell_price',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          sellPriceSignificantDigits: {
            field: 'sell_price_significant_digits',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          sellStopPrice: {
            field: 'sell_stop_price',
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          sellValidUntil: {
            field: 'sell_valid_until',
            type: Sequelize.DATE,
            allowNull: true,
          },
          sellProviderId: {
            field: 'sell_provider_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          sellProviderOrderId: {
            field: 'sell_provider_order_id',
            type: Sequelize.STRING,
            allowNull: false,
          },
          sellProviderName: {
            field: 'sell_provider_name',
            type: Sequelize.STRING,
            allowNull: false,
          },
          sellExecutedPrice: {
            field: 'sell_executed_price',
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          sellExecutedAmount: {
            field: 'sell_executed_amount',
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          sellFee: {
            field: 'sell_fee',
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          buyProviderId: {
            field: 'buy_provider_id',
            type: Sequelize.UUID,
            allowNull: true,
          },
          buyProviderOrderId: {
            field: 'buy_provider_order_id',
            type: Sequelize.STRING,
            allowNull: true,
          },
          buyProviderName: {
            field: 'buy_provider_name',
            type: Sequelize.STRING,
            allowNull: true,
          },
          buyPriceSignificantDigits: {
            field: 'buy_price_significant_digits',
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          buyExecutedPrice: {
            field: 'buy_executed_price',
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          buyExecutedAmount: {
            field: 'buy_executed_amount',
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          buyFee: {
            field: 'buy_fee',
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          sellOrderId: {
            field: 'sell_order_id',
            type: Sequelize.UUID,
            allowNull: true,
          },
          buyOrderId: {
            field: 'buy_order_id',
            type: Sequelize.UUID,
            allowNull: true,
          },
          failedCode: {
            field: 'failed_code',
            type: Sequelize.STRING,
            allowNull: true,
          },
          failedMessage: {
            field: 'failed_message',
            type: Sequelize.TEXT,
            allowNull: true,
          },
          createdAt: {
            field: 'created_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          updatedAt: {
            field: 'updated_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
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
      await queryInterface.dropTable('bot_otc_orders', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
