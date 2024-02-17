'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'stream_pairs',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          baseCurrencyId: {
            field: 'base_currency_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          quoteCurrencyId: {
            field: 'quote_currency_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          priority: {
            field: 'priority',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          gatewayName: {
            field: 'gateway_name',
            type: Sequelize.STRING,
            allowNull: false,
          },
          active: {
            field: 'active',
            type: Sequelize.BOOLEAN,
            allowNull: false,
          },
          composedByIds: {
            field: 'composed_by_ids',
            type: Sequelize.STRING,
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('stream_pairs', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
