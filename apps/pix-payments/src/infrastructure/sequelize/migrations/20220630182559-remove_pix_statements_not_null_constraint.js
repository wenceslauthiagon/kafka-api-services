'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.changeColumn(
        'pix_statements',
        'owner_name',
        { type: Sequelize.STRING, allowNull: true },
        { transaction },
      );
      await queryInterface.changeColumn(
        'pix_statements',
        'beneficiary_name',
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

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.changeColumn(
        'pix_statements',
        'owner_name',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );
      await queryInterface.changeColumn(
        'pix_statements',
        'beneficiary_name',
        {
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
};
