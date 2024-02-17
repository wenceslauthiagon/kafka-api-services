'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'jdpi_notify_credit_devolutions',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          externalId: {
            field: 'external_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          originalEndToEndId: {
            field: 'original_end_to_end_id',
            type: Sequelize.STRING,
            allowNull: false,
          },
          devolutionEndToEndId: {
            field: 'devolution_end_to_end_id',
            type: Sequelize.STRING,
            allowNull: false,
          },
          devolutionCode: {
            field: 'devolution_code',
            type: Sequelize.STRING,
            allowNull: false,
          },
          devolutionReason: {
            field: 'devolution_reason',
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
          thirdPartName: {
            field: 'third_part_name',
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
          informationBetweenClients: {
            field: 'information_between_clients',
            type: Sequelize.STRING,
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
      await queryInterface.dropTable('jdpi_notify_credit_devolutions', {
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
