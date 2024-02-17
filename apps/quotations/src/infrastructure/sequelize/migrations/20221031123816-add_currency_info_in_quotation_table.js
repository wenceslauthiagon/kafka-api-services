'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.addColumn(
          'quotations',
          'quote_currency_title',
          {
            type: Sequelize.STRING,
            defaultValue: null,
            allowNull: true,
          },
          { transaction },
        ),
        queryInterface.addColumn(
          'quotations',
          'quote_currency_symbol',
          {
            type: Sequelize.STRING,
            defaultValue: null,
            allowNull: true,
          },
          { transaction },
        ),
        queryInterface.addColumn(
          'quotations',
          'quote_currency_decimal',
          {
            type: Sequelize.INTEGER,
            defaultValue: null,
            allowNull: true,
          },
          { transaction },
        ),
        queryInterface.addColumn(
          'quotations',
          'base_currency_title',
          {
            type: Sequelize.STRING,
            defaultValue: null,
            allowNull: true,
          },
          { transaction },
        ),
        queryInterface.addColumn(
          'quotations',
          'base_currency_symbol',
          {
            type: Sequelize.STRING,
            defaultValue: null,
            allowNull: true,
          },
          { transaction },
        ),
        queryInterface.addColumn(
          'quotations',
          'base_currency_decimal',
          {
            type: Sequelize.INTEGER,
            defaultValue: null,
            allowNull: true,
          },
          { transaction },
        ),
      ]);

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
      await Promise.all([
        queryInterface.removeColumn('quotations', 'quote_currency_title', {
          transaction,
        }),
        queryInterface.removeColumn('quotations', 'quote_currency_symbol', {
          transaction,
        }),
        queryInterface.removeColumn('quotations', 'quote_currency_decimal', {
          transaction,
        }),
        queryInterface.removeColumn('quotations', 'base_currency_title', {
          transaction,
        }),
        queryInterface.removeColumn('quotations', 'base_currency_symbol', {
          transaction,
        }),
        queryInterface.removeColumn('quotations', 'base_currency_decimal', {
          transaction,
        }),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
