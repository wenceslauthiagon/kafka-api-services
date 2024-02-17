'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await Promise.all([
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'document',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'additional_info',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'type',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'allow_update',
          { type: Sequelize.BOOLEAN },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'pss',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'withdraw_value',
          { type: Sequelize.BIGINT },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_qr_code',
          'change_value',
          {
            type: 'BIGINT USING CAST("change_value" as BIGINT)',
          },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'access_token',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'version',
          { type: Sequelize.STRING },
          { transaction },
        ),
        queryInterface.addColumn(
          'pix_decoded_qr_code',
          'additional_infos',
          { type: Sequelize.JSON },
          { transaction },
        ),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'receive_after_due_date',
          { transaction },
        ),
        queryInterface.removeColumn('pix_decoded_qr_code', 'description', {
          transaction,
        }),
        queryInterface.removeColumn('pix_decoded_qr_code', 'payer_email', {
          transaction,
        }),
        queryInterface.removeColumn('pix_decoded_qr_code', 'payer_phone', {
          transaction,
        }),
        queryInterface.removeColumn('pix_decoded_qr_code', 'payer_address', {
          transaction,
        }),
        queryInterface.removeColumn('pix_decoded_qr_code', 'payer_request', {
          transaction,
        }),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'recipient_postal_code',
          { transaction },
        ),
        queryInterface.removeColumn('pix_decoded_qr_code', 'original_value', {
          transaction,
        }),
        queryInterface.removeColumn('pix_decoded_qr_code', 'review', {
          transaction,
        }),
        queryInterface.removeColumn('pix_decoded_qr_code', 'pix_key', {
          transaction,
        }),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'payer_solicitation',
          { transaction },
        ),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'free_additional_info',
          { transaction },
        ),
        queryInterface.removeColumn('pix_decoded_qr_code', 'signature', {
          transaction,
        }),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'calendar_due_date',
          { transaction },
        ),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'calendar_expiration_date',
          { transaction },
        ),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'receivable_after_expiration_date',
          { transaction },
        ),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'due_date_after_expiration_date',
          { transaction },
        ),
        queryInterface.removeColumn('pix_decoded_qr_code', 'debtor_name', {
          transaction,
        }),
        queryInterface.removeColumn('pix_decoded_qr_code', 'debtor_cpf', {
          transaction,
        }),
        queryInterface.removeColumn('pix_decoded_qr_code', 'debtor_cnpj', {
          transaction,
        }),
        queryInterface.removeColumn('pix_decoded_qr_code', 'value_deduction', {
          transaction,
        }),
        queryInterface.removeColumn('pix_decoded_qr_code', 'value_discount', {
          transaction,
        }),
        queryInterface.removeColumn('pix_decoded_qr_code', 'value_final', {
          transaction,
        }),
        queryInterface.removeColumn('pix_decoded_qr_code', 'value_fees', {
          transaction,
        }),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'value_alteration_modality',
          { transaction },
        ),
        queryInterface.removeColumn('pix_decoded_qr_code', 'value_fine', {
          transaction,
        }),
        queryInterface.removeColumn('pix_decoded_qr_code', 'value_original', {
          transaction,
        }),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'withdrawal_agent_modality',
          { transaction },
        ),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'withdrawal_alteration_modality',
          { transaction },
        ),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'withdrawal_service_provider',
          { transaction },
        ),
        queryInterface.removeColumn('pix_decoded_qr_code', 'withdrawal_value', {
          transaction,
        }),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'change_agent_modality',
          { transaction },
        ),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'change_alteration_modality',
          { transaction },
        ),
        queryInterface.removeColumn(
          'pix_decoded_qr_code',
          'change_withdraw_service_provider',
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

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('pix_decoded_qr_code', 'document', {
        transaction,
      });
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'additional_info',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn('pix_decoded_qr_code', 'type', {
        transaction,
      });
      await queryInterface.removeColumn('pix_decoded_qr_code', 'allow_update', {
        transaction,
      });
      await queryInterface.removeColumn('pix_decoded_qr_code', 'pss', {
        transaction,
      });
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'withdraw_value',
        {
          transaction,
        },
      );
      await queryInterface.changeColumn(
        'pix_decoded_qr_code',
        'change_value',
        {
          type: Sequelize.STRING,
        },
        { transaction },
      );
      await queryInterface.removeColumn('pix_decoded_qr_code', 'access_token', {
        transaction,
      });
      await queryInterface.removeColumn('pix_decoded_qr_code', 'version', {
        transaction,
      });
      await queryInterface.removeColumn(
        'pix_decoded_qr_code',
        'additional_infos',
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'receive_after_due_date',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'description',
        { type: Sequelize.TEXT },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'payer_email',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'payer_phone',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'payer_address',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'payer_request',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'recipient_postal_code',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'original_value',
        { type: Sequelize.BIGINT },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'review',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'pix_key',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'payer_solicitation',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'free_additional_info',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'signature',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'calendar_due_date',
        { type: Sequelize.DATE },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'calendar_expiration_date',
        { type: Sequelize.DATE },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'receivable_after_expiration_date',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'due_date_after_expiration_date',
        { type: Sequelize.DATE },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'debtor_name',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'debtor_cpf',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'debtor_cnpj',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'value_deduction',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'value_discount',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'value_final',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'value_fees',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'value_alteration_modality',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'value_fine',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'value_original',
        { type: Sequelize.STRING },
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'withdrawal_agent_modality',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'withdrawal_alteration_modality',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'withdrawal_service_provider',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'withdrawal_value',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'change_agent_modality',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'change_alteration_modality',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'pix_decoded_qr_code',
        'change_withdraw_service_provider',
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
