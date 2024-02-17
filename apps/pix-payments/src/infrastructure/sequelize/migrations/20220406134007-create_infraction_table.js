'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_infractions',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          issueId: {
            field: 'issue_id',
            type: Sequelize.INTEGER,
          },
          infractionPspId: {
            field: 'infraction_psp_id',
            type: Sequelize.UUID,
          },
          operationId: {
            field: 'operation_id',
            type: Sequelize.UUID,
          },
          paymentId: {
            field: 'payment_id',
            allowNull: false,
            type: Sequelize.UUID,
          },
          description: {
            type: Sequelize.TEXT,
          },
          summary: {
            allowNull: false,
            type: Sequelize.TEXT,
          },
          infractionType: {
            field: 'infraction_type',
            allowNull: false,
            type: Sequelize.STRING,
          },
          status: {
            allowNull: false,
            type: Sequelize.STRING,
          },
          state: {
            allowNull: false,
            type: Sequelize.STRING,
          },
          analysisResult: {
            field: 'analysis_result',
            type: Sequelize.TEXT,
          },
          reportBy: {
            field: 'report_by',
            type: Sequelize.STRING,
          },
          ispbDebitedParticipant: {
            field: 'ispb_debited_participant',
            type: Sequelize.STRING,
          },
          ispbCreditedParticipant: {
            field: 'ispb_credited_participant',
            type: Sequelize.STRING,
          },
          ispb: {
            type: Sequelize.STRING,
          },
          endToEndId: {
            field: 'end_to_end_id',
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
          createdAt: {
            field: 'created_at',
            allowNull: false,
            type: Sequelize.DATE,
          },
          updatedAt: {
            field: 'updated_at',
            allowNull: false,
            type: Sequelize.DATE,
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('pix_infractions', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
