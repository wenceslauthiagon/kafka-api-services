'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_refunds',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          summary: {
            allowNull: false,
            type: Sequelize.TEXT,
          },
          solicitationPspId: {
            field: 'solicitation_psp_id',
            type: Sequelize.UUID,
          },
          issueId: {
            field: 'issue_id',
            type: Sequelize.INTEGER,
          },
          contested: {
            field: 'contested',
            type: Sequelize.BOOLEAN,
          },
          amount: {
            field: 'amount',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          description: {
            field: 'description',
            type: Sequelize.TEXT,
          },
          reason: {
            field: 'reason',
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
          state: {
            field: 'state',
            type: Sequelize.STRING,
            allowNull: false,
          },
          status: {
            field: 'status',
            type: Sequelize.STRING,
            allowNull: false,
          },
          analysisResult: {
            field: 'analysis_result',
            type: Sequelize.TEXT,
          },
          analysisDetails: {
            field: 'analysis_details',
            type: Sequelize.TEXT,
          },
          rejection_reason: {
            field: 'rejection_reason',
            type: Sequelize.STRING,
          },
          transactionId: {
            field: 'transaction_id',
            type: Sequelize.UUID,
            nullable: false,
          },
          infractionId: {
            field: 'infraction_id',
            type: Sequelize.UUID,
            references: {
              model: 'pix_infractions',
              key: 'id',
            },
          },
          operationId: {
            field: 'operation_id',
            type: Sequelize.UUID,
          },
          failed_code: {
            field: 'failed_code',
            type: Sequelize.STRING,
          },
          failed_message: {
            field: 'failed_message',
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
          transactionType: {
            field: 'transaction_type',
            type: Sequelize.STRING,
          },
          transactionId: {
            field: 'transaction_id',
            type: Sequelize.UUID,
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
      await queryInterface.dropTable('pix_refunds', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
