'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addIndex(
        'pix_decoded_account',
        ['document', 'account_number', 'branch'],
        {
          transaction,
          name: 'pix_decoded_account_document_account_number_branch_key',
        },
      );

      await queryInterface.addIndex(
        'pix_decoded_account',
        ['user_id', 'bank_ispb', 'account_number', 'branch'],
        {
          transaction,
          name: 'pix_decoded_account_user_id_bank_ispb_account_number_branch_key',
        },
      );

      await queryInterface.addIndex(
        'pix_decoded_account',
        ['user_id', 'state', 'created_at'],
        {
          transaction,
          name: 'pix_decoded_account_user_id_state_created_at_key',
        },
      );

      await queryInterface.addIndex('pix_payments', ['end_to_end_id'], {
        transaction,
        name: 'pix_payments_end_to_end_id_key',
      });

      await queryInterface.addIndex(
        'pix_payments',
        ['operation_id', 'change_operation_id', 'wallet_id'],
        {
          transaction,
          name: 'pix_payments_operation_id_change_operation_id_wallet_id_key',
        },
      );

      await queryInterface.addIndex('pix_payments', ['state', 'payment_date'], {
        transaction,
        name: 'pix_payments_state_payment_date_key',
      });

      await queryInterface.addIndex('pix_payments', ['id', 'wallet_id'], {
        transaction,
        name: 'pix_payments_id_wallet_id_key',
      });

      await queryInterface.addIndex('pix_payments', ['state'], {
        transaction,
        name: 'pix_payments_state_key',
      });

      await queryInterface.addIndex(
        'pix_payments',
        [
          'user_id',
          'wallet_id',
          'state',
          'payment_date',
          'created_at',
          'end_to_end_id',
          'owner_document',
        ],
        {
          transaction,
          name: 'pix_payments_user_id_wallet_id_state_payment_date_created_at_end_to_end_id_owner_document_key',
        },
      );

      await queryInterface.addIndex(
        'pix_payments',
        ['operation_id', 'change_operation_id'],
        {
          transaction,
          name: 'pix_payments_operation_id_change_operation_id_key',
        },
      );

      await queryInterface.addIndex('pix_deposits', ['id', 'wallet_id'], {
        transaction,
        name: 'pix_deposits_id_wallet_id_key',
      });

      await queryInterface.addIndex('pix_deposits', ['operation_id'], {
        transaction,
        name: 'pix_deposits_operation_id_key',
      });

      await queryInterface.addIndex(
        'pix_deposits',
        ['operation_id', 'wallet_id'],
        {
          transaction,
          name: 'pix_deposits_operation_id_wallet_id_key',
        },
      );

      await queryInterface.addIndex('pix_deposits', ['end_to_end_id'], {
        transaction,
        name: 'pix_deposits_end_to_end_id_key',
      });

      await queryInterface.addIndex(
        'pix_deposits',
        [
          'user_id',
          'wallet_id',
          'end_to_end_id',
          'client_document',
          'state',
          'created_at',
        ],
        {
          transaction,
          name: 'pix_deposits_user_id_wallet_id_end_to_end_id_client_document_state_created_at_key',
        },
      );

      await queryInterface.addIndex(
        'pix_devolutions_received',
        ['id', 'wallet_id'],
        {
          transaction,
          name: 'pix_devolutions_received_id_wallet_id_key',
        },
      );

      await queryInterface.addIndex(
        'pix_devolutions_received',
        ['operation_id', 'wallet_id'],
        {
          transaction,
          name: 'pix_devolutions_received_operation_id_wallet_id_key',
        },
      );

      await queryInterface.addIndex(
        'pix_devolutions_received',
        ['operation_id'],
        {
          transaction,
          name: 'pix_devolutions_received_operation_id_key',
        },
      );

      await queryInterface.addIndex(
        'pix_devolutions_received',
        ['end_to_end_id'],
        {
          transaction,
          name: 'pix_devolutions_received_end_to_end_id_key',
        },
      );

      await queryInterface.addIndex(
        'pix_devolutions_received',
        [
          'user_id',
          'wallet_id',
          'end_to_end_id',
          'client_document',
          'state',
          'created_at',
        ],
        {
          transaction,
          name: 'pix_devolutions_received_user_id_wallet_id_end_to_end_id_client_document_state_created_at_key',
        },
      );

      await queryInterface.addIndex('pix_devolutions', ['id', 'wallet_id'], {
        transaction,
        name: 'pix_devolutions_id_wallet_id_key',
      });

      await queryInterface.addIndex(
        'pix_devolutions',
        ['deposit_id', 'state'],
        {
          transaction,
          name: 'pix_devolutions_deposit_id_state_key',
        },
      );

      await queryInterface.addIndex('pix_devolutions', ['state'], {
        transaction,
        name: 'pix_devolutions_state_key',
      });

      await queryInterface.addIndex(
        'pix_devolutions',
        ['operation_id', 'wallet_id'],
        {
          transaction,
          name: 'pix_devolutions_operation_id_wallet_id_key',
        },
      );

      await queryInterface.addIndex('pix_devolutions', ['operation_id'], {
        transaction,
        name: 'pix_devolutions_operation_id_key',
      });

      await queryInterface.addIndex(
        'pix_devolutions',
        [
          'user_id',
          'wallet_id',
          'end_to_end_id',
          'deposit_id',
          'state',
          'created_at',
        ],
        {
          transaction,
          name: 'pix_devolutions_user_id_wallet_id_end_to_end_id_deposit_id_state_created_at_key',
        },
      );

      await queryInterface.addIndex('pix_infractions', ['infraction_psp_id'], {
        transaction,
        name: 'pix_infractions_infraction_psp_id_key',
      });

      await queryInterface.addIndex('pix_infractions', ['issue_id'], {
        transaction,
        name: 'pix_infractions_issue_id_key',
      });

      await queryInterface.addIndex(
        'pix_infractions',
        ['infraction_type', 'state', 'analysis_result'],
        {
          transaction,
          name: 'pix_infractions_infraction_type_state_analysis_result_key',
        },
      );

      await queryInterface.addIndex('pix_refund_devolutions', ['state'], {
        transaction,
        name: 'pix_refund_devolutions_state_key',
      });

      await queryInterface.addIndex(
        'pix_refund_devolutions',
        ['transaction_id', 'state'],
        {
          transaction,
          name: 'pix_refund_devolutions_transaction_id_state_key',
        },
      );

      await queryInterface.addIndex('pix_refunds', ['issue_id'], {
        transaction,
        name: 'pix_refunds_issue_id_key',
      });

      await queryInterface.addIndex('pix_refunds', ['infraction_id'], {
        transaction,
        name: 'pix_refunds_infraction_id_key',
      });

      await queryInterface.addIndex('pix_refunds', ['refund_devolution_id'], {
        transaction,
        name: 'pix_refunds_refund_devolution_id_key',
      });

      await queryInterface.addIndex('pix_refunds', ['solicitation_psp_id'], {
        transaction,
        name: 'pix_refunds_solicitation_psp_id_key',
      });

      await queryInterface.addIndex('pix_qr_code_dynamic', ['id', 'user_id'], {
        transaction,
        name: 'pix_qr_code_dynamic_id_user_id_key',
      });

      await queryInterface.addIndex('pix_qr_code_static', ['key_id'], {
        transaction,
        name: 'pix_qr_code_static_key_id_key',
      });

      await queryInterface.addIndex('pix_qr_code_static', ['user_id'], {
        transaction,
        name: 'pix_qr_code_static_user_id_key',
      });

      await queryInterface.addIndex(
        'warning_pix_deposit_bank_block_list',
        ['cnpj'],
        {
          transaction,
          name: 'warning_pix_deposit_bank_block_list_cnpj_key',
        },
      );

      await queryInterface.addIndex(
        'warning_pix_deposits',
        [
          'user_id',
          'transaction_tag',
          'operation_id',
          'created_at',
          'updated_at',
        ],
        {
          transaction,
          name: 'warning_pix_deposits_user_id_transaction_tag_operation_id_created_at_updated_at_key',
        },
      );

      await queryInterface.addIndex('warning_pix_deposits', ['operation_id'], {
        transaction,
        name: 'warning_pix_deposits_operation_id_key',
      });

      await queryInterface.addIndex(
        'warning_pix_devolutions',
        ['operation_id'],
        {
          transaction,
          name: 'warning_pix_devolutions_operation_id_key',
        },
      );

      await queryInterface.addIndex('warning_pix_devolutions', ['state'], {
        transaction,
        name: 'warning_pix_devolutions_state_key',
      });

      await queryInterface.addIndex(
        'warning_pix_skip_list',
        ['client_account_number'],
        {
          transaction,
          name: 'warning_pix_skip_list_client_account_number_key',
        },
      );

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
      await queryInterface.removeIndex(
        'pix_decoded_account',
        'pix_decoded_account_document_account_number_branch_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_decoded_account',
        'pix_decoded_account_user_id_bank_ispb_account_number_branch_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_decoded_account',
        'pix_decoded_account_user_id_state_created_at_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_payments',
        'pix_payments_end_to_end_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_payments',
        'pix_payments_operation_id_change_operation_id_wallet_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_payments',
        'pix_payments_state_payment_date_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_payments',
        'pix_payments_id_wallet_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_payments',
        'pix_payments_state_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_payments',
        'pix_payments_user_id_wallet_id_state_payment_date_created_at_end_to_end_id_owner_document_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_payments',
        'pix_payments_operation_id_change_operation_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_deposits',
        'pix_deposits_id_wallet_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_deposits',
        'pix_deposits_operation_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_deposits',
        'pix_deposits_operation_id_wallet_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_deposits',
        'pix_deposits_end_to_end_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_deposits',
        'pix_deposits_user_id_wallet_id_end_to_end_id_client_document_state_created_at_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_devolutions_received',
        'pix_devolutions_received_id_wallet_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_devolutions_received',
        'pix_devolutions_received_operation_id_wallet_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_devolutions_received',
        'pix_devolutions_received_operation_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_devolutions_received',
        'pix_devolutions_received_end_to_end_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_devolutions_received',
        'pix_devolutions_received_user_id_wallet_id_end_to_end_id_client_document_state_created_at_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_devolutions',
        'pix_devolutions_id_wallet_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_devolutions',
        'pix_devolutions_deposit_id_state_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_devolutions',
        'pix_devolutions_state_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_devolutions',
        'pix_devolutions_operation_id_wallet_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_devolutions',
        'pix_devolutions_operation_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_devolutions',
        'pix_devolutions_user_id_wallet_id_end_to_end_id_deposit_id_state_created_at_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_infractions',
        'pix_infractions_infraction_psp_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_infractions',
        'pix_infractions_issue_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_infractions',
        'pix_infractions_infraction_type_state_analysis_result_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_refund_devolutions',
        'pix_refund_devolutions_state_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_refund_devolutions',
        'pix_refund_devolutions_transaction_id_state_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_refunds',
        'pix_refunds_issue_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_refunds',
        'pix_refunds_infraction_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_refunds',
        'pix_refunds_refund_devolution_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_refunds',
        'pix_refunds_solicitation_psp_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_qr_code_dynamic',
        'pix_qr_code_dynamic_id_user_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_qr_code_static',
        'pix_qr_code_static_key_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_qr_code_static',
        'pix_qr_code_static_user_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'warning_pix_deposit_bank_block_list',
        'warning_pix_deposit_bank_block_list_cnpj_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'warning_pix_deposits',
        'warning_pix_deposits_user_id_transaction_tag_operation_id_created_at_updated_at_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'warning_pix_deposits',
        'warning_pix_deposits_operation_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'warning_pix_devolutions',
        'warning_pix_devolutions_operation_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'warning_pix_devolutions',
        'warning_pix_devolutions_state_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'warning_pix_skip_list',
        'warning_pix_skip_list_client_account_number_key',
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
