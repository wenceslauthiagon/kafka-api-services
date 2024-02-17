'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'topazio_notify_infractions',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          infractionId: {
            field: 'infraction_id',
            type: Sequelize.UUID,
          },
          operationTransactionId: {
            field: 'operation_transaction_id',
            type: Sequelize.UUID,
          },
          ispb: {
            field: 'ispb',
            type: Sequelize.STRING,
          },
          endToEndId: {
            field: 'end_to_end_id',
            type: Sequelize.STRING,
          },
          infractionType: {
            field: 'infraction_type',
            type: Sequelize.STRING,
          },
          reportedBy: {
            field: 'reported_by',
            type: Sequelize.STRING,
          },
          reportDetails: {
            field: 'report_details',
            type: Sequelize.TEXT,
          },
          status: {
            field: 'status',
            type: Sequelize.STRING,
          },
          debitedParticipant: {
            field: 'debited_participant',
            type: Sequelize.STRING,
          },
          creditedParticipant: {
            field: 'credited_participant',
            type: Sequelize.STRING,
          },
          creationDate: {
            field: 'creation_date',
            type: Sequelize.DATE,
          },
          lastChangeDate: {
            field: 'last_change_date',
            type: Sequelize.DATE,
          },
          analysisResult: {
            field: 'analysis_result',
            type: Sequelize.STRING,
          },
          analysisDetails: {
            field: 'analysis_details',
            type: Sequelize.TEXT,
          },
          isReporter: {
            field: 'is_reporter',
            type: Sequelize.BOOLEAN,
          },
          closingDate: {
            field: 'closing_date',
            type: Sequelize.DATE,
          },
          cancellationDate: {
            field: 'cancellation_date',
            type: Sequelize.DATE,
          },
          state: {
            field: 'state',
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
      await queryInterface.dropTable('topazio_notify_infractions', {
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
