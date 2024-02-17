'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'exchange_quotations',
        'provider_id',
        {
          field: 'provider_id',
          type: Sequelize.UUID,
        },
        {
          transaction,
        },
      );

      await queryInterface.addColumn(
        'exchange_quotations',
        'system_id',
        {
          field: 'system_id',
          type: Sequelize.UUID,
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
      await queryInterface.removeColumn('exchange_quotations', 'provider_id', {
        transaction,
      });

      await queryInterface.removeColumn('exchange_quotations', 'system_id', {
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
