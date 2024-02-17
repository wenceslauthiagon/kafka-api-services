'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn(
        'warning_pix_deposits',
        'block_reason',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'warning_pix_deposits',
        'transaction_type',
        {
          transaction,
        },
      );

      await queryInterface.addColumn(
        'warning_pix_deposits',
        'transaction_tag',
        {
          field: 'transaction_tag',
          type: Sequelize.STRING,
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
        'warning_pix_deposits',
        'block_reason',
        {
          field: 'block_reason',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'warning_pix_deposits',
        'transaction_type',
        {
          field: 'transaction_type',
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.removeColumn(
        'warning_pix_deposits',
        'transaction_tag',
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
};
