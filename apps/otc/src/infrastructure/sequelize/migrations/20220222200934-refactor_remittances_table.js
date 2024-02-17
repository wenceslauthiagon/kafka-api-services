'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const transaction = await queryInterface.sequelize.transaction();

      await queryInterface.addColumn(
        'Remittances',
        'removed_motive',
        {
          field: 'removed_motive',
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

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

      await queryInterface.addColumn(
        'Remittances',
        'removed_by_admin_name',
        {
          field: 'removed_by_admin_name',
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Remittances',
        'removed_at',
        {
          field: 'removed_at',
          type: Sequelize.DATE,
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

  down: async (queryInterface) => {
    try {
      const transaction = await queryInterface.sequelize.transaction();

      await queryInterface.removeColumn('Remittances', 'removed_motive', {
        transaction,
      });

      await queryInterface.removeColumn('Remittances', 'removed_by_admin_id', {
        transaction,
      });

      await queryInterface.removeColumn(
        'Remittances',
        'removed_by_admin_name',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn('Remittances', 'removed_at', {
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
