'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add analysis_tag column
      await queryInterface.addColumn(
        'Operations',
        'analysis_tags',
        {
          field: 'analysis_tags',
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true,
        },
        { transaction },
      );

      // Add user_limit_tracker_id column
      await queryInterface.addColumn(
        'Operations',
        'user_limit_tracker_id',
        { type: Sequelize.UUID },
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
      await queryInterface.removeColumn('Operations', 'analysis_tags', {
        transaction,
      });

      await queryInterface.removeColumn('Operations', 'user_limit_tracker_id', {
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
