'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'jdpi_notify_credit_validations',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          initiationType: {
            field: 'initiation_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          paymentPriorityType: {
            field: 'payment_priority_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          paymentPriorityLevelType: {
            field: 'payment_priority_level_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          finalityType: {
            field: 'finality_type',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          agentModalityType: {
            field: 'agent_modality_type',
            type: Sequelize.STRING,
          },
          ispbPss: {
            field: 'ispb_pss',
            type: Sequelize.STRING,
          },
          paymentInitiatorDocument: {
            field: 'payment_initiator_document',
            type: Sequelize.STRING,
          },
          thirdPartIspb: {
            field: 'third_part_ispb',
            type: Sequelize.STRING,
            allowNull: false,
          },
          thirdPartPersonType: {
            field: 'third_part_person_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          thirdPartDocument: {
            field: 'third_part_document',
            type: Sequelize.STRING,
            allowNull: false,
          },
          thirdPartName: {
            field: 'third_part_name',
            type: Sequelize.STRING,
            allowNull: false,
          },
          thirdPartBranch: {
            field: 'third_part_branch',
            type: Sequelize.STRING,
          },
          thirdPartAccountType: {
            field: 'third_part_account_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          thirdPartAccountNumber: {
            field: 'third_part_account_number',
            type: Sequelize.STRING,
            allowNull: false,
          },
          clientIspb: {
            field: 'client_ispb',
            type: Sequelize.STRING,
            allowNull: false,
          },
          clientPersonType: {
            field: 'client_person_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          clientDocument: {
            field: 'client_document',
            type: Sequelize.STRING,
            allowNull: false,
          },
          clientBranch: {
            field: 'client_branch',
            type: Sequelize.STRING,
          },
          clientAccountType: {
            field: 'client_account_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          clientAccountNumber: {
            field: 'client_account_number',
            type: Sequelize.STRING,
            allowNull: false,
          },
          amount: {
            field: 'amount',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          amountDetails: {
            field: 'amount_details',
            type: Sequelize.ARRAY(Sequelize.JSONB),
          },
          informationBetweenClients: {
            field: 'information_between_clients',
            type: Sequelize.STRING,
          },
          state: {
            field: 'state',
            type: Sequelize.STRING,
          },
          endToEndId: {
            field: 'end_to_end_id',
            type: Sequelize.STRING,
          },
          clientConciliationId: {
            field: 'client_conciliation_id',
            type: Sequelize.STRING,
          },
          key: {
            field: 'key',
            type: Sequelize.STRING,
          },
          originalEndToEndId: {
            field: 'original_end_to_end_id',
            type: Sequelize.STRING,
          },
          devolutionEndToEndId: {
            field: 'devolution_end_to_end_id',
            type: Sequelize.STRING,
          },
          devolutionCode: {
            field: 'devolution_code',
            type: Sequelize.STRING,
          },
          devolutionReason: {
            field: 'devolution_reason',
            type: Sequelize.STRING,
          },
          responseResultType: {
            field: 'response_result_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          responseDevolutionCode: {
            field: 'response_devolution_code',
            type: Sequelize.STRING,
          },
          responseDescription: {
            field: 'response_description',
            type: Sequelize.STRING,
          },
          responseCreatedAt: {
            field: 'response_created_at',
            type: Sequelize.DATE,
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
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('jdpi_notify_credit_validations', {
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
