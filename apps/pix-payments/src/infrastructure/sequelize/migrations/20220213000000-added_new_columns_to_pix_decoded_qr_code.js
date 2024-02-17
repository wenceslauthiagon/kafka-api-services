'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'calendar_due_date',
          { type: Sequelize.DATE },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'calendar_expiration_date',
          { type: Sequelize.DATE },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'receivable_after_expiration_date',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'due_date_after_expiration_date',
          { type: Sequelize.DATE },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'debtor_name',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'debtor_cpf',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'debtor_cnpj',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'value_deduction',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'value_discount',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'value_final',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'value_fees',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'value_alteration_modality',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'value_fine',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'value_original',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'withdrawal_agent_modality',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'withdrawal_alteration_modality',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'withdrawal_service_provider',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'withdrawal_value',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'change_agent_modality',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'change_alteration_modality',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'change_withdraw_service_provider',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'change_value',
          { type: Sequelize.STRING },
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
        'pix_decoded_qr_code',
        'calendar_due_date',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'calendar_expiration_date',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'receivable_after_expiration_date',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'due_date_after_expiration_date',
        { transaction },
      );
      await queryInterface.removeColumn('pix_decoded_qr_code', 'debtor_name', {
        transaction,
      });
      await queryInterface.removeColumn('pix_decoded_qr_code', 'debtor_cpf', {
        transaction,
      });
      await queryInterface.removeColumn('pix_decoded_qr_code', 'debtor_cnpj', {
        transaction,
      });
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'value_deduction',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'value_discount',
        { transaction },
      );
      await queryInterface.removeColumn('pix_decoded_qr_code', 'value_final', {
        transaction,
      });
      await queryInterface.removeColumn('pix_decoded_qr_code', 'value_fees', {
        transaction,
      });
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'value_alteration_modality',
        { transaction },
      );
      await queryInterface.removeColumn('pix_decoded_qr_code', 'value_fine', {
        transaction,
      });
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'value_original',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'withdrawal_agent_modality',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'withdrawal_alteration_modality',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'withdrawal_service_provider',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'withdrawal_value',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'change_agent_modality',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'change_alteration_modality',
        { transaction },
      );
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'change_withdraw_service_provider',
        { transaction },
      );
      await queryInterface.removeColumn('pix_decoded_qr_code', 'change_value', {
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
