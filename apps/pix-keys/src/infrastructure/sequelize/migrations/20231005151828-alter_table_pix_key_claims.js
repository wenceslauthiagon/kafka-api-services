'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.changeColumn(
        'pix_key_claims',
        'document',
        { type: Sequelize.STRING, allowNull: true },
        { transaction },
      );
      await queryInterface.changeColumn(
        'pix_key_claims',
        'person_type',
        { type: Sequelize.STRING, allowNull: true },
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
        'pix_key_claims',
        'document',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.changeColumn(
        'pix_key_claims',
        'person_type',
        { type: Sequelize.STRING },
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
