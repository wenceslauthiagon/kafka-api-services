'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'exchange_quotations',
        'gateway_name',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        {
          transaction,
        },
      );

      await queryInterface.renameColumn(
        'exchange_quotations',
        'fx_rate',
        'quotation',
        {
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.log(error);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('exchange_quotations', 'gateway_name', {
        transaction,
      });

      await queryInterface.renameColumn(
        'exchange_quotations',
        'quotation',
        'fx_rate',
        {
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.log(error);
      throw error;
    }
  },
};
