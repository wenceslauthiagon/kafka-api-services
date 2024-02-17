'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'report_users',
        'type',
        {
          field: 'type',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'report_users',
        'mother_name',
        {
          field: 'mother_name',
          type: Sequelize.STRING,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'report_users',
        'birth_date',
        {
          field: 'birth_date',
          type: Sequelize.DATE,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'report_users',
        'genre',
        {
          field: 'genre',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'report_users',
        'onboarding_pep_since',
        {
          field: 'onboarding_pep_since',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'report_users',
        'occupation_name',
        {
          field: 'occupation_name',
          type: Sequelize.STRING,
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('report_users', 'type', {
        transaction,
      });
      await queryInterface.removeColumn('report_users', 'mother_name', {
        transaction,
      });
      await queryInterface.removeColumn('report_users', 'birth_date', {
        transaction,
      });
      await queryInterface.removeColumn('report_users', 'genre', {
        transaction,
      });

      await queryInterface.removeColumn(
        'report_users',
        'onboarding_pep_since',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn('report_users', 'occupation_name', {
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
