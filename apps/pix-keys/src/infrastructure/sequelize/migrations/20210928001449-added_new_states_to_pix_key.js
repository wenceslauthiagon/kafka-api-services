'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_keys',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          key: {
            field: 'key',
            type: Sequelize.STRING,
            allowNull: true,
          },
          type: {
            field: 'type',
            type: Sequelize.ENUM('CPF', 'CNPJ', 'PHONE', 'EMAIL', 'EVP'),
            allowNull: false,
          },
          state: {
            field: 'state',
            type: Sequelize.ENUM(
              'PENDING',
              'CONFIRMED',
              'NOT_CONFIRMED',
              'ADD_KEY_READY',
              'READY',
              'CANCELED',
              'DELETING',
              'DELETED',
              'DELETED_ERROR',
              'PORTABILITY_PENDING',
              'PORTABILITY_OPENED',
              'PORTABILITY_STARTED',
              'PORTABILITY_READY',
              'PORTABILITY_CONFIRMED',
              'PORTABILITY_CANCELED',
              'PORTABILITY_REQUEST_PENDING',
              'PORTABILITY_REQUEST_CANCEL_OPENED',
              'PORTABILITY_REQUEST_CANCEL_STARTED',
              'PORTABILITY_REQUEST_CONFIRM_OPENED',
              'PORTABILITY_REQUEST_CONFIRM_STARTED',
              'OWNERSHIP_PENDING',
              'OWNERSHIP_OPENED',
              'OWNERSHIP_STARTED',
              'OWNERSHIP_CONFIRM_PENDING',
              'OWNERSHIP_CONFIRMED',
              'OWNERSHIP_READY',
              'OWNERSHIP_CANCELED',
              'OWNERSHIP_WAITING',
              'CLAIM_PENDING',
              'CLAIM_CLOSING',
              'CLAIM_DENIED',
              'CLAIM_CLOSED',
              'ERROR',
              'CLAIM_CANCELED',
            ),
            allowNull: false,
          },
          code: {
            field: 'code',
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'Code sent by e-mail or SMS.',
          },
          personType: {
            field: 'person_type',
            type: Sequelize.STRING,
            allowNull: false,
            comment: 'Key person type.',
          },
          document: {
            field: 'document',
            type: Sequelize.STRING,
            allowNull: false,
            comment: 'Key owner document.',
          },
          name: {
            field: 'name',
            type: Sequelize.STRING,
            allowNull: false,
            comment: 'Key owner name.',
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          accountNumber: {
            field: 'account_number',
            type: Sequelize.STRING,
            allowNull: false,
          },
          branch: {
            field: 'branch',
            type: Sequelize.STRING,
            allowNull: false,
          },
          accountOpeningDate: {
            field: 'account_opening_date',
            type: Sequelize.DATE,
            allowNull: false,
          },
          deletedByReason: {
            field: 'deleted_by_reason',
            type: Sequelize.TEXT,
            allowNull: true,
          },
          deletedBy: {
            field: 'deleted_by',
            type: Sequelize.UUID,
            allowNull: true,
            comment: 'Admin UUID who deleted the key.',
          },
          canceledAt: {
            field: 'canceled_at',
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'Timestamp when key was canceled.',
          },
          deletedAt: {
            field: 'deleted_at',
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'Timestamp when key was deleted by user or admin.',
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
        },
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

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('pix_keys', { transaction });
      await queryInterface.dropEnum('enum_pix_keys_state', { transaction });
      await queryInterface.dropEnum('enum_pix_keys_type', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
