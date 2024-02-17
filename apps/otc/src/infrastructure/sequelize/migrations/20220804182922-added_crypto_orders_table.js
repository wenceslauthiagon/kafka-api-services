'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'crypto_orders',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          quoteCurrencyId: {
            field: 'quote_currency_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          baseCurrencyId: {
            field: 'base_currency_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          amount: {
            field: 'amount',
            type: Sequelize.FLOAT,
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
          state: {
            field: 'state',
            type: Sequelize.STRING,
            allowNull: false,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
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
      await queryInterface.dropTable('crypto_orders', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
