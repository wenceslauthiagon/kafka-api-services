'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await Promise.all([
        queryInterface.addColumn(
          'pix_qr_code_dynamic',
          'recipient_name',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_qr_code_dynamic',
          'recipient_address',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_qr_code_dynamic',
          'recipient_zip_code',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_qr_code_dynamic',
          'recipient_feredative_unit',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_qr_code_dynamic',
          'recipient_document',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_qr_code_dynamic',
          'recipient_person_type',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_qr_code_dynamic',
          'allow_update_change',
          { type: Sequelize.BOOLEAN },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_qr_code_dynamic',
          'allow_update_withdrawal',
          { type: Sequelize.BOOLEAN },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_qr_code_dynamic',
          'due_date',
          { type: Sequelize.DATE },
          { transaction },
        ),
      ]);

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
        'pix_qr_code_dynamic',
        'recipient_name',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'pix_qr_code_dynamic',
        'recipient_address',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'pix_qr_code_dynamic',
        'recipient_zip_code',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'pix_qr_code_dynamic',
        'recipient_feredative_unit',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'pix_qr_code_dynamic',
        'recipient_document',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'pix_qr_code_dynamic',
        'recipient_person_type',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'pix_qr_code_dynamic',
        'allow_update_change',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'pix_qr_code_dynamic',
        'allow_update_withdrawal',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn('pix_qr_code_dynamic', 'due_date', {
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
