'use strict';

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn(
        'pix_devolutions_received',
        'client_bank_code',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_devolutions_received',
        'third_part_bank_code',
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'pix_devolutions_received',
        'client_bank_code',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_devolutions_received',
        'third_part_bank_code',
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
