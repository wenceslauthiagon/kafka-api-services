'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn(
        'remittance_orders',
        'client_order_id',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'remittance_orders',
        'order_quantity_currency',
        { transaction },
      );

      await queryInterface.removeColumn('remittance_orders', 'symbol', {
        transaction,
      });

      await queryInterface.removeColumn('remittance_orders', 'account', {
        transaction,
      });

      await queryInterface.changeColumn(
        'remittance_orders',
        'price',
        {
          field: 'price',
          type: Sequelize.DECIMAL(16, 4),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'remittance_orders',
        'order_quantity',
        {
          field: 'order_quantity',
          type: Sequelize.DECIMAL(16, 4),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.renameColumn(
        'remittance_orders',
        'timestamp',
        'order_timestamp',
        {
          transaction,
        },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'client_name',
        {
          field: 'client_name',
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'client_document',
        {
          field: 'client_document',
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'client_document_type',
        {
          field: 'client_document_type',
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'currency_id',
        {
          field: 'currency_id',
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'currency_tag',
        {
          field: 'currency_tag',
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'quantity',
        {
          field: 'quantity',
          type: Sequelize.DECIMAL(16, 4),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'market_status',
        { field: 'market_status', type: Sequelize.STRING, allowNull: false },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'fiat_amount',
        {
          field: 'fiat_amount',
          type: Sequelize.DECIMAL(16, 4),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'order_quantity_currency_id',
        {
          field: 'order_quantity_currency_id',
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'order_quantity_currency_tag',
        {
          field: 'order_quantity_currency_tag',
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'order_type',
        {
          field: 'order_type',
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'order_price',
        {
          field: 'order_price',
          type: Sequelize.DECIMAL(16, 4),
          allowNull: false,
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

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'remittance_orders',
        'client_order_id',
        {
          field: 'client_order_id',
          type: Sequelize.UUID,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'order_quantity_currency',
        {
          field: 'order_quantity_currency',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'symbol',
        {
          field: 'symbol',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'remittance_orders',
        'account',
        {
          field: 'account',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'remittance_orders',
        'price',
        {
          field: 'price',
          type: Sequelize.DOUBLE,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'remittance_orders',
        'order_quantity',
        {
          field: 'order_quantity',
          type: Sequelize.DOUBLE,
        },
        { transaction },
      );

      await queryInterface.renameColumn(
        'remittance_orders',
        'order_timestamp',
        'timestamp',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn('remittance_orders', 'client_name', {
        transaction,
      });

      await queryInterface.removeColumn(
        'remittance_orders',
        'client_document',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'remittance_orders',
        'client_document_type',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn('remittance_orders', 'currency_id', {
        transaction,
      });

      await queryInterface.removeColumn('remittance_orders', 'currency_tag', {
        transaction,
      });

      await queryInterface.removeColumn('remittance_orders', 'quantity', {
        transaction,
      });

      await queryInterface.removeColumn('remittance_orders', 'market_status', {
        transaction,
      });

      await queryInterface.removeColumn('remittance_orders', 'fiat_amount', {
        transaction,
      });

      await queryInterface.removeColumn(
        'remittance_orders',
        'order_quantity_currency_id',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'remittance_orders',
        'order_quantity_currency_tag',
        { transaction },
      );

      await queryInterface.removeColumn('remittance_orders', 'order_type', {
        transaction,
      });

      await queryInterface.removeColumn('remittance_orders', 'order_price', {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
