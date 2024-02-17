'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_infractions_refund_operations',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          state: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          pixInfractionId: {
            field: 'pix_infraction_id',
            type: Sequelize.STRING,
            allowNull: true,
          },
          pixRefundId: {
            field: 'pix_refund_id',
            type: Sequelize.STRING,
            allowNull: true,
          },
          originalOperationId: {
            field: 'original_operation_id',
            type: Sequelize.STRING,
            allowNull: false,
          },
          originalOperationValue: {
            field: 'original_operation_value',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          refundOperationId: {
            field: 'refund_operation_id',
            type: Sequelize.STRING,
            allowNull: false,
          },
          refundOperationValue: {
            field: 'refund_operation_value',
            type: Sequelize.BIGINT,
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
      await queryInterface.dropTable('pix_infractions_refund_operations', {
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
