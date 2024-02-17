'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableDefinition = await queryInterface.describeTable(
        'BankingContacts',
      );

      // This check exists because in dev and production already exists the column but local not
      if (!tableDefinition['deleted_at']) {
        await queryInterface.addColumn(
          'BankingContacts',
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
      await queryInterface.removeColumn('BankingContacts', 'deleted_at', {
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
