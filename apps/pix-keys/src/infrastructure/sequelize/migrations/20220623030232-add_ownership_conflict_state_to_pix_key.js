'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.changeColumn(
        'pix_keys',
        'state',
        { type: Sequelize.STRING, allowNull: false },
        { transaction },
      );

      await queryInterface.dropEnum('enum_pix_keys_state', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
  down: async () => console.log('Nothing to do.'),
};
