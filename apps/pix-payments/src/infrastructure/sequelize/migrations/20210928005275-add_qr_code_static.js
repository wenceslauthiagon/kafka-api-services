'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_qr_code_static',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          keyId: {
            field: 'key_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          key: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          keyType: {
            field: 'key_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          txId: {
            field: 'txid',
            type: Sequelize.STRING,
          },
          summary: {
            type: Sequelize.STRING,
          },
          description: {
            type: Sequelize.TEXT,
          },
          documentValue: {
            field: 'document_value',
            type: Sequelize.FLOAT,
          },
          recipientCity: {
            field: 'recipient_city',
            type: Sequelize.STRING,
            allowNull: false,
          },
          emv: {
            type: Sequelize.TEXT,
          },
          ispb: {
            type: Sequelize.STRING,
          },
          paymentLinkUrl: {
            field: 'payment_link_url',
            type: Sequelize.STRING,
          },
          state: {
            type: Sequelize.STRING,
            allowNull: false,
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
      await queryInterface.dropTable('pix_qr_code_static', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
