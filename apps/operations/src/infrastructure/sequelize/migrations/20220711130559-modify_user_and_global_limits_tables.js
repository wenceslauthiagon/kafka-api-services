'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Users_limits',
        'max_amount_nightly',
        {
          field: 'max_amount_nightly',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits',
        'min_amount_nightly',
        {
          field: 'min_amount_nightly',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits',
        'user_max_amount',
        {
          field: 'user_max_amount',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits',
        'user_min_amount',
        {
          field: 'user_min_amount',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits',
        'user_max_amount_nightly',
        {
          field: 'user_max_amount_nightly',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Users_limits',
        'user_min_amount_nightly',
        {
          field: 'user_min_amount_nightly',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Global_limits',
        'max_amount_nightly',
        {
          field: 'max_amount_nightly',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Global_limits',
        'min_amount_nightly',
        {
          field: 'min_amount_nightly',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Global_limits',
        'user_max_amount',
        {
          field: 'user_max_amount',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Global_limits',
        'user_min_amount',
        {
          field: 'user_min_amount',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Global_limits',
        'user_max_amount_nightly',
        {
          field: 'user_max_amount_nightly',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Global_limits',
        'user_min_amount_nightly',
        {
          field: 'user_min_amount_nightly',
          type: Sequelize.BIGINT,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Users_limits', 'max_amount_nightly', {
        transaction,
      });

      await queryInterface.removeColumn('Users_limits', 'min_amount_nightly', {
        transaction,
      });

      await queryInterface.removeColumn('Users_limits', 'user_max_amount', {
        transaction,
      });

      await queryInterface.removeColumn('Users_limits', 'user_min_amount', {
        transaction,
      });

      await queryInterface.removeColumn(
        'Users_limits',
        'user_max_amount_nightly',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'Users_limits',
        'user_min_amount_nightly',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn('Global_limits', 'max_amount_nightly', {
        transaction,
      });

      await queryInterface.removeColumn('Global_limits', 'min_amount_nightly', {
        transaction,
      });

      await queryInterface.removeColumn('Global_limits', 'user_max_amount', {
        transaction,
      });

      await queryInterface.removeColumn('Global_limits', 'user_min_amount', {
        transaction,
      });

      await queryInterface.removeColumn(
        'Global_limits',
        'user_max_amount_nightly',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'Global_limits',
        'user_min_amount_nightly',
        {
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },
};
