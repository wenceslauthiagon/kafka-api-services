'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'pix_key_claims',
        'final_resolution_date',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_key_claims',
        'final_complete_date',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_key_claims',
        'last_change_date',
        { type: Sequelize.DATE, allowNull: true },
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
      await queryInterface.removeColumn(
        'pix_key_claims',
        'final_resolution_date',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_key_claims',
        'final_complete_date',
        { transaction },
      );
      await queryInterface.removeColumn('pix_key_claims', 'last_change_date', {
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
