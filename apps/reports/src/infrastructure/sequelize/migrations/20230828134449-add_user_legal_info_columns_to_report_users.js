'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'report_users',
        'constitution_desc',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'report_users',
        'cnae',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'report_users',
        'employee_qty',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'report_users',
        'overseas_branches_qty',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'report_users',
        'is_third_party_relashionship',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'report_users',
        'is_credit_card_admin',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'report_users',
        'is_patrimony_trust',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'report_users',
        'is_payment_facilitator',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'report_users',
        'is_regulated_pld',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'report_users',
        'legal_naturity_code',
        {
          type: Sequelize.STRING,
          allowNull: true,
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
      await queryInterface.removeColumn('report_users', 'constitution_desc', {
        transaction,
      });

      await queryInterface.removeColumn('report_users', 'cnae', {
        transaction,
      });

      await queryInterface.removeColumn('report_users', 'employee_qty', {
        transaction,
      });

      await queryInterface.removeColumn(
        'report_users',
        'overseas_branches_qty',
        { transaction },
      );

      await queryInterface.removeColumn(
        'report_users',
        'is_third_party_relashionship',
        { transaction },
      );

      await queryInterface.removeColumn(
        'report_users',
        'is_credit_card_admin',
        { transaction },
      );

      await queryInterface.removeColumn('report_users', 'is_patrimony_trust', {
        transaction,
      });

      await queryInterface.removeColumn(
        'report_users',
        'is_payment_facilitator',
        { transaction },
      );

      await queryInterface.removeColumn('report_users', 'is_regulated_pld', {
        transaction,
      });

      await queryInterface.removeColumn('report_users', 'legal_naturity_code', {
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
