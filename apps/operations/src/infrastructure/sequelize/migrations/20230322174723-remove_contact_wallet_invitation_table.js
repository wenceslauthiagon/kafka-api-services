'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.renameColumn(
        'wallet_invitations',
        'contact_information',
        'email',
        { transaction },
      );

      await queryInterface.removeColumn('wallet_invitations', 'contact_type', {
        transaction,
      });

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
      await queryInterface.renameColumn(
        'wallet_invitations',
        'email',
        'contact_information',
        { transaction },
      );

      await queryInterface.addColumn(
        'wallet_invitations',
        'contact_type',
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
};
