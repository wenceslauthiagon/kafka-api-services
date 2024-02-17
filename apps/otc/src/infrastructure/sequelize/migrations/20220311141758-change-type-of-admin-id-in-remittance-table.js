'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Remittances', 'removed_by_admin_id', {
        transaction,
      });

      await queryInterface.addColumn(
        'Remittances',
        'removed_by_admin_id',
        {
          field: 'removed_by_admin_id',
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
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
      await queryInterface.removeColumn('Remittances', 'removed_by_admin_id', {
        transaction,
      });

      await queryInterface.addColumn(
        'Remittances',
        'removed_by_admin_id',
        {
          field: 'removed_by_admin_id',
          type: Sequelize.UUID,
          allowNull: true,
          defaultValue: null,
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
