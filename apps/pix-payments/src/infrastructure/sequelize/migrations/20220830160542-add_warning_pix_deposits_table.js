'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('warning_pix_deposits', {
        id: {
          field: 'id',
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        operationId: {
          field: 'operation_id',
          type: Sequelize.UUID,
          allowNull: false,
        },
        transactionType: {
          field: 'transaction_type',
          type: Sequelize.STRING,
          allowNull: false,
        },
        userId: {
          field: 'user_id',
          type: Sequelize.UUID,
          allowNull: false,
        },
        state: {
          field: 'state',
          type: Sequelize.STRING,
          allowNull: false,
        },
        rejectedReason: {
          field: 'rejected_reason',
          type: Sequelize.STRING,
          allowNull: true,
        },
        blockReason: {
          field: 'block_reason',
          type: Sequelize.STRING,
          allowNull: true,
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
      });

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
      await queryInterface.dropTable('warning_pix_deposits', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
