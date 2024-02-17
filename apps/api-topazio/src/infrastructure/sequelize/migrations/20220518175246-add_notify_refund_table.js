'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'topazio_notify_refunds',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          solicitationId: {
            field: 'solicitation_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          transactionId: {
            field: 'transaction_id',
            type: Sequelize.UUID,
            allowNull: true,
          },
          contested: {
            field: 'contested',
            type: Sequelize.BOOLEAN,
          },
          endToEndId: {
            field: 'end_to_end_id',
            type: Sequelize.STRING,
            allowNull: false,
          },
          refundAmount: {
            field: 'refund_amount',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          refundDetails: {
            field: 'refund_details',
            type: Sequelize.TEXT,
          },
          refundReason: {
            field: 'refund_reason',
            type: Sequelize.STRING,
          },
          refundRejectionReason: {
            field: 'refund_rejection_reason',
            type: Sequelize.STRING,
          },
          refundType: {
            field: 'refund_type',
            type: Sequelize.STRING,
          },
          refundAnalisysDetails: {
            field: 'refund_analisys_details',
            type: Sequelize.TEXT,
          },
          refundAnalisysResult: {
            field: 'refund_analisys_result',
            type: Sequelize.STRING,
          },
          requesterIspb: {
            field: 'requester_ispb',
            type: Sequelize.STRING,
          },
          responderIspb: {
            field: 'responder_ispb',
            type: Sequelize.STRING,
          },
          status: {
            field: 'status',
            type: Sequelize.STRING,
            allowNull: false,
          },
          creationDate: {
            field: 'creation_date',
            type: Sequelize.DATE,
          },
          infractionId: {
            field: 'infraction_id',
            type: Sequelize.UUID,
          },
          devolutionId: {
            field: 'devolution_id',
            type: Sequelize.STRING,
          },
          lastChangeDate: {
            field: 'last_change_date',
            type: Sequelize.DATE,
          },
          state: {
            field: 'state',
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
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('topazio_notify_refunds', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
