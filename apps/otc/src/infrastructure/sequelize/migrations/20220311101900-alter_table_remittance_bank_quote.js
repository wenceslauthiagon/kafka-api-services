module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.changeColumn(
        'Remittances',
        'bank_quote',
        {
          field: 'bank_quote',
          type: Sequelize.INTEGER,
        },
        {
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.changeColumn(
        'Remittances',
        'bank_quote',
        {
          field: 'bank_quote',
          type: Sequelize.DECIMAL(16, 4),
        },
        {
          transaction,
        },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
    }
  },
};
