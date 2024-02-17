'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.changeColumn(
        'crypto_remittances',
        'status',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'crypto_remittances',
        'provider_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'crypto_remittances',
        'base_currency_type',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'crypto_remittances',
        'quote_currency_type',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'crypto_orders',
        'provider_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
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
      await queryInterface.changeColumn(
        'crypto_remittances',
        'status',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.removeColumn('crypto_remittances', 'provider_id', {
        transaction,
      });
      await queryInterface.removeColumn(
        'crypto_remittances',
        'base_currency_type',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(
        'crypto_remittances',
        'quote_currency_type',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn('crypto_orders', 'provider_id', {
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
