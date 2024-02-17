'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE pix_qr_code_dynamic ALTER COLUMN description SET NOT NULL;',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_qr_code_dynamic',
        'expires_in_minutes',
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_qr_code_dynamic',
        'expiration_date',
        {
          field: 'expiration_date',
          type: Sequelize.DATE,
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

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE pix_qr_code_dynamic ALTER COLUMN description DROP NOT NULL',
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_qr_code_dynamic',
        'expires_in_minutes',
        {
          field: 'expires_in_minutes',
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.removeColumn(
        'pix_qr_code_dynamic',
        'expiration_date',
        {
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
