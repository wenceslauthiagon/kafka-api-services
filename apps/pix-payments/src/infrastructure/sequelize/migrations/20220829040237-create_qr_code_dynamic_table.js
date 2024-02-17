'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_qr_code_dynamic',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          keyId: {
            field: 'key_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          recipientCity: {
            field: 'recipient_city',
            type: Sequelize.STRING,
          },
          documentValue: {
            field: 'document_value',
            type: Sequelize.BIGINT,
          },
          summary: {
            type: Sequelize.STRING,
          },
          description: {
            type: Sequelize.STRING,
          },
          payerName: { field: 'payer_name', type: Sequelize.STRING },
          payerPersonType: {
            field: 'payer_person_type',
            type: Sequelize.STRING,
          },
          payerDocument: {
            field: 'payer_document',
            type: Sequelize.STRING,
          },
          payerEmail: {
            field: 'payer_email',
            type: Sequelize.STRING,
          },
          payerCity: {
            field: 'payer_city',
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
          allowUpdate: {
            field: 'allow_update',
            type: Sequelize.BOOLEAN,
            allowNull: false,
          },
          expiresInMinutes: {
            field: 'expires_in_minutes',
            type: Sequelize.INTEGER,
          },
          state: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          emv: {
            type: Sequelize.STRING,
          },
          paymentLinkUrl: {
            field: 'payment_link_url',
            type: Sequelize.STRING,
          },
          txId: {
            field: 'txid',
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
      await queryInterface.dropTable('pix_qr_code_dynamic', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
