'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('remittance_orders', { transaction });

      await queryInterface.createTable(
        'remittance_orders',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          side: {
            field: 'side',
            type: Sequelize.STRING,
            allowNull: false,
          },
          currencyId: {
            field: 'currency_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          amount: {
            field: 'amount',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          status: {
            field: 'status',
            type: Sequelize.STRING,
            allowNull: false,
          },
          systemId: {
            field: 'system_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          providerId: {
            field: 'provider_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          cryptoRemittanceId: {
            field: 'crypto_remittance_id',
            type: Sequelize.UUID,
            allowNull: true,
          },
          remittanceId: {
            field: 'remittance_id',
            type: Sequelize.UUID,
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

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('remittance_orders', { transaction });

      await queryInterface.createTable(
        'remittance_orders',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          clientName: {
            field: 'client_name',
            type: Sequelize.STRING,
            allowNull: false,
          },
          clientDocument: {
            field: 'client_document',
            type: Sequelize.STRING,
            allowNull: false,
          },
          clientDocumentType: {
            field: 'client_document_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          remittanceId: {
            field: 'remittance_id',
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: 'Remittances',
              key: 'id',
            },
          },
          systemId: {
            field: 'system_id',
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'systems',
              key: 'id',
            },
          },
          systemTag: {
            field: 'system_tag',
            type: Sequelize.STRING,
            allowNull: false,
          },
          providerId: {
            field: 'provider_id',
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'Providers',
              key: 'id',
            },
          },
          providerTag: {
            field: 'provider_tag',
            type: Sequelize.STRING,
            allowNull: false,
          },
          quotationId: {
            field: 'quotation_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          currencyId: {
            field: 'currency_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          currencyTag: {
            field: 'currency_tag',
            type: Sequelize.STRING,
            allowNull: false,
          },
          price: {
            field: 'price',
            type: Sequelize.DECIMAL(16, 4),
            allowNull: false,
          },
          quantity: {
            field: 'quantity',
            type: Sequelize.DECIMAL(16, 4),
            allowNull: false,
          },
          side: {
            field: 'side',
            type: Sequelize.STRING,
            allowNull: false,
          },
          marketStatus: {
            field: 'market_status',
            type: Sequelize.STRING,
            allowNull: false,
          },
          fiatAmount: {
            field: 'fiat_amount',
            type: Sequelize.DECIMAL(16, 4),
            allowNull: false,
          },
          orderId: {
            field: 'order_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          orderQuantity: {
            field: 'order_quantity',
            type: Sequelize.DECIMAL(16, 4),
            allowNull: false,
          },
          orderQuantityCurrencyId: {
            field: 'order_quantity_currency_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          orderQuantityCurrencyTag: {
            field: 'order_quantity_currency_tag',
            type: Sequelize.STRING,
            allowNull: false,
          },
          orderType: {
            field: 'order_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          orderPrice: {
            field: 'order_price',
            type: Sequelize.DECIMAL(16, 4),
            allowNull: false,
          },
          orderTimestamp: {
            field: 'order_timestamp',
            type: Sequelize.DATE,
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
};
