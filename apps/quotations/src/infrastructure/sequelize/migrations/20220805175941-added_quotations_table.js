'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'quotations',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          providerId: {
            field: 'provider_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          streamPairId: {
            field: 'stream_pair_id',
            type: Sequelize.UUID,
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
            allowNull: false,
          },
          priceBuy: {
            field: 'price_buy',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          priceSell: {
            field: 'price_sell',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          partialBuy: {
            field: 'partial_buy',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          partialSell: {
            field: 'partial_sell',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          iofId: {
            field: 'iof_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          iofAmount: {
            field: 'iof_amount',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          spreadId: {
            field: 'spread_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          spreadBuyAmount: {
            field: 'spread_buy_amount',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          spreadSellAmount: {
            field: 'spread_sell_amount',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          quoteCurrencyId: {
            field: 'quote_currency_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          quoteAmountBuy: {
            field: 'quote_amount_buy',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          quoteAmountSell: {
            field: 'quote_amount_sell',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          baseCurrencyId: {
            field: 'base_currency_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          baseAmountBuy: {
            field: 'base_amount_buy',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          baseAmountSell: {
            field: 'base_amount_sell',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          streamQuotation: {
            field: 'stream_quotation',
            type: Sequelize.JSONB,
            allowNull: false,
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
          deletedAt: {
            field: 'deleted_at',
            type: Sequelize.DATE,
            allowNull: true,
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
      await queryInterface.dropTable('quotations', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
