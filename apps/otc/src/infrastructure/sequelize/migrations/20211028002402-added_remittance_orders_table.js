module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'remittance_orders',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          orderId: {
            field: 'order_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          clientOrderId: {
            field: 'client_order_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          quotationId: {
            field: 'quotation_id',
            type: Sequelize.UUID,
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
          side: {
            field: 'side',
            type: Sequelize.STRING,
            allowNull: false,
          },
          orderQuantity: {
            field: 'order_quantity',
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          orderQuantityCurrency: {
            field: 'order_quantity_currency',
            type: Sequelize.STRING,
            allowNull: false,
          },
          symbol: {
            field: 'symbol',
            type: Sequelize.STRING,
            allowNull: false,
          },
          price: {
            field: 'price',
            type: Sequelize.DOUBLE,
            allowNull: false,
          },
          account: {
            field: 'account',
            type: Sequelize.STRING,
            allowNull: true,
          },
          timestamp: {
            field: 'timestamp',
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

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('remittance_orders', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
