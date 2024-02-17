'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'pix_key_claims',
        'claim_opening_date',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_key_claims',
        'claim_closing_date',
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

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn(
        'pix_key_claims',
        'claim_opening_date',
        { type: Sequelize.DATE },
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_key_claims',
        'claim_closing_date',
        { type: Sequelize.DATE },
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
