'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'topazio_notify_quotations',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          currency: {
            field: 'currency',
            type: Sequelize.STRING,
            allowNull: false,
          },
          tradeId: {
            field: 'trade_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          quotationId: {
            field: 'quotation_id',
            type: Sequelize.STRING,
            allowNull: false,
          },
          externalValue: {
            field: 'external_value',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          internalValue: {
            field: 'internal_value',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          fxRate: {
            field: 'fx_rate',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          state: {
            field: 'state',
            type: Sequelize.STRING,
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
      await queryInterface.dropTable('topazio_notify_quotations', {
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
