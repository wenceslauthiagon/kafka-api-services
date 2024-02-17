'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('conversion_orders', {
        id: {
          field: 'id',
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
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
        systemId: {
          field: 'system_id',
          type: Sequelize.UUID,
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
        side: {
          field: 'side',
          type: Sequelize.STRING,
          allowNull: false,
        },
        price: {
          field: 'price',
          type: Sequelize.BIGINT,
        },
        priceSignificantDigits: {
          field: 'price_significant_digits',
          type: Sequelize.INTEGER,
        },
        providerOrderId: {
          field: 'provider_order_id',
          type: Sequelize.STRING,
        },
        providerName: {
          field: 'provider_name',
          type: Sequelize.STRING,
        },
        status: {
          field: 'status',
          type: Sequelize.STRING,
        },
        executedPrice: {
          field: 'executed_price',
          type: Sequelize.INTEGER,
        },
        executedQuantity: {
          field: 'executed_quantity',
          type: Sequelize.INTEGER,
        },
        fee: {
          field: 'fee',
          type: Sequelize.INTEGER,
        },
        created_at: {
          field: 'created_at',
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        updated_at: {
          field: 'updated_at',
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });
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
      await queryInterface.dropTable('conversion_orders');

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
