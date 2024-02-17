'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      //Alter type value to bigint
      await queryInterface.changeColumn(
        'pix_qr_code_static',
        'document_value',
        {
          field: 'document_value',
          type: Sequelize.BIGINT,
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

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.changeColumn(
        'pix_qr_code_static',
        'document_value',
        {
          field: 'document_value',
          type: Sequelize.FLOAT,
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
