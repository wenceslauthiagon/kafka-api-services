'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      //Add Column
      await queryInterface.addColumn(
        'pix_deposits',
        'state',
        {
          field: 'state',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'pix_deposits',
        { state: 'READY' },
        { state: null },
        { transaction },
      );

      await queryInterface.changeColumn(
        'pix_deposits',
        'state',
        {
          field: 'state',
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

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('pix_deposits', 'state', {
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
