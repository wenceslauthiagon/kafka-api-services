'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableDefinition = await queryInterface.describeTable(
        'BankingAccountContacts',
      );

      if (!tableDefinition['deleted_at']) {
        await queryInterface.addColumn(
          'BankingAccountContacts',
          'deleted_at',
          { type: Sequelize.DATE },
          { transaction },
        );
      }

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
      await queryInterface.removeColumn(
        'BankingAccountContacts',
        'deleted_at',
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
