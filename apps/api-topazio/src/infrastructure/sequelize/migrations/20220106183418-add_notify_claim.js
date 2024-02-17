'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'topazio_notify_claims',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          requestId: {
            field: 'request_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          accountOpeningDate: {
            field: 'account_opening_date',
            type: Sequelize.DATE,
            allowNull: true,
          },
          accountType: {
            field: 'account_type',
            type: Sequelize.BOOLEAN,
            allowNull: true,
          },
          branch: {
            field: 'branch',
            type: Sequelize.STRING,
            allowNull: true,
          },
          accountNumber: {
            field: 'account_number',
            type: Sequelize.STRING,
            allowNull: true,
          },
          claimReason: {
            field: 'claim_reason',
            type: Sequelize.STRING,
            allowNull: true,
          },
          claimType: {
            field: 'claim_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          document: {
            field: 'document',
            type: Sequelize.STRING,
            allowNull: true,
          },
          donation: {
            field: 'donation',
            type: Sequelize.BOOLEAN,
            allowNull: false,
          },
          donorIspb: {
            field: 'donor_ispb',
            type: Sequelize.STRING,
            allowNull: true,
          },
          requestIspb: {
            field: 'request_ispb',
            type: Sequelize.STRING,
            allowNull: true,
          },
          endCompleteDate: {
            field: 'end_complete_date',
            type: Sequelize.DATE,
            allowNull: true,
          },
          endResolutionDate: {
            field: 'end_resolution_date',
            type: Sequelize.DATE,
            allowNull: true,
          },
          lastChangeDate: {
            field: 'last_change_date',
            type: Sequelize.DATE,
            allowNull: true,
          },
          ispb: {
            field: 'ispb',
            type: Sequelize.STRING,
            allowNull: true,
          },
          key: {
            field: 'key',
            type: Sequelize.STRING,
            allowNull: false,
          },
          keyType: {
            field: 'key_type',
            type: Sequelize.STRING,
            allowNull: true,
          },
          name: {
            field: 'name',
            type: Sequelize.STRING,
            allowNull: true,
          },
          personType: {
            field: 'person_type',
            type: Sequelize.STRING,
            allowNull: true,
          },
          status: {
            field: 'status',
            type: Sequelize.STRING,
            allowNull: false,
          },
          tradeName: {
            field: 'trade_name',
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
      await queryInterface.dropTable('topazio_notify_claims', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
