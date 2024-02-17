'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.changeColumn(
        'Remittances',
        'client_amount',
        {
          field: 'client_amount',
          type: Sequelize.DECIMAL(16, 4),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Remittances',
        'total_amount',
        {
          field: 'total_amount',
          type: Sequelize.DECIMAL(16, 4),
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Remittances',
        'result_amount',
        {
          field: 'result_amount',
          type: Sequelize.DECIMAL(16, 4),
        },
        { transaction },
      );

      await queryInterface.removeColumn('Remittances', 'bank_quote', {
        transaction,
      });

      await queryInterface.addColumn(
        'Remittances',
        'bank_quote',
        {
          field: 'bank_quote',
          type: Sequelize.DECIMAL(16, 4),
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
        'Remittances',
        'client_amount',
        {
          field: 'client_amount',
          type: Sequelize.BIGINT,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Remittances',
        'total_amount',
        {
          field: 'total_amount',
          type: Sequelize.BIGINT,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Remittances',
        'result_amount',
        {
          field: 'result_amount',
          type: Sequelize.BIGINT,
        },
        { transaction },
      );

      await queryInterface.removeColumn('Remittances', 'bank_quote', {
        transaction,
      });

      await queryInterface.addColumn(
        'Remittances',
        'bank_quote',
        {
          field: 'bank_quote',
          type: Sequelize.DECIMAL(16, 4),
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
