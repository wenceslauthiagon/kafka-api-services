'use strict';

/**
 * Adds to table Remittances new optional columns send_date_code and receive_date_code.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Remittances',
        'send_date_code',
        {
          field: 'send_date_code',
          type: Sequelize.STRING,
        },
        {
          transaction,
        },
      );

      await queryInterface.addColumn(
        'Remittances',
        'receive_date_code',
        {
          field: 'receive_date_code',
          type: Sequelize.STRING,
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
      await queryInterface.removeColumn('Remittances', 'send_date_code', {
        transaction,
      });

      await queryInterface.removeColumn('Remittances', 'receive_date_code', {
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
