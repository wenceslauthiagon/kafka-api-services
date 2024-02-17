'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_decoded_qr_code',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          emv: {
            field: 'emv',
            type: Sequelize.STRING,
            allowNull: false,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          cityCode: {
            field: 'city_code',
            type: Sequelize.STRING,
          },
          receiveAfterDueDate: {
            field: 'receive_after_due_date',
            type: Sequelize.STRING,
          },
          paymentDate: {
            field: 'payment_date',
            type: Sequelize.DATE,
          },
          key: {
            type: Sequelize.STRING,
          },
          txId: {
            field: 'txid',
            type: Sequelize.STRING,
          },
          dueDate: {
            field: 'due_date',
            type: Sequelize.DATE,
          },
          documentValue: {
            field: 'document_value',
            type: Sequelize.BIGINT,
          },
          paymentValue: {
            field: 'payment_value',
            type: Sequelize.BIGINT,
          },
          description: {
            type: Sequelize.TEXT,
          },
          payerPersonType: {
            field: 'payer_person_type',
            type: Sequelize.STRING,
          },
          payerDocument: {
            field: 'payer_document',
            type: Sequelize.STRING,
          },
          payerName: {
            field: 'payer_name',
            type: Sequelize.STRING,
          },
          payerEmail: {
            field: 'payer_email',
            type: Sequelize.STRING,
          },
          payerPhone: {
            field: 'payer_phone',
            type: Sequelize.STRING,
          },
          payerAddress: {
            field: 'payer_address',
            type: Sequelize.STRING,
          },
          payerRequest: {
            field: 'payer_request',
            type: Sequelize.STRING,
          },
          recipientName: {
            field: 'recipient_name',
            type: Sequelize.STRING,
          },
          recipientPersonType: {
            field: 'recipient_person_type',
            type: Sequelize.STRING,
          },
          recipientDocument: {
            field: 'recipient_document',
            type: Sequelize.STRING,
          },
          recipientIspb: {
            field: 'recipient_ispb',
            type: Sequelize.STRING,
          },
          recipientBranch: {
            field: 'recipient_branch',
            type: Sequelize.STRING,
          },
          recipientAccountType: {
            field: 'recipient_account_type',
            type: Sequelize.STRING,
          },
          recipientAccountNumber: {
            field: 'recipient_account_number',
            type: Sequelize.STRING,
          },
          recipientBankCode: {
            field: 'recipient_bank_code',
            type: Sequelize.STRING,
          },
          recipientBankName: {
            field: 'recipient_bank_name',
            type: Sequelize.STRING,
          },
          recipientCity: {
            field: 'recipient_city',
            type: Sequelize.STRING,
          },
          recipientPostalCode: {
            field: 'recipient_postal_code',
            type: Sequelize.STRING,
          },
          expirationDate: {
            field: 'expiration_date',
            type: Sequelize.DATE,
          },
          interestValue: {
            field: 'interest_value',
            type: Sequelize.BIGINT,
          },
          fineValue: {
            field: 'fine_value',
            type: Sequelize.BIGINT,
          },
          discountValue: {
            field: 'discount_value',
            type: Sequelize.BIGINT,
          },
          endToEndId: {
            field: 'end_to_end_id',
            type: Sequelize.STRING,
          },
          originalValue: {
            field: 'original_value',
            type: Sequelize.BIGINT,
          },
          deductionValue: {
            field: 'deduction_value',
            type: Sequelize.BIGINT,
          },
          review: {
            type: Sequelize.STRING,
          },
          pixKey: {
            field: 'pix_key',
            type: Sequelize.STRING,
          },
          payerSolicitation: {
            field: 'payer_solicitation',
            type: Sequelize.STRING,
          },
          freeAdditionalInfo: {
            field: 'free_additional_info',
            type: Sequelize.STRING,
          },
          signature: {
            type: Sequelize.STRING,
          },
          status: {
            type: Sequelize.STRING,
          },
          state: {
            type: Sequelize.STRING,
          },
          createdAt: {
            field: 'created_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          updatedAt: {
            field: 'updated_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          deletedAt: {
            field: 'deleted_at',
            type: Sequelize.DATE,
            allowNull: true,
          },
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

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('pix_decoded_qr_code', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
