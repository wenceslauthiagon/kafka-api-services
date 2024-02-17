'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_decoded_keys',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          type: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          key: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          personType: {
            field: 'person_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          document: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          tradeName: {
            field: 'trade_name',
            type: Sequelize.STRING,
            allowNull: true,
          },
          accountNumber: {
            field: 'account_number',
            type: Sequelize.UUID,
            allowNull: false,
          },
          accountType: {
            field: 'account_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          branch: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          ispb: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          activeAccount: {
            field: 'active_account',
            type: Sequelize.BOOLEAN,
            allowNull: false,
          },
          accountOpeningDate: {
            field: 'account_opening_date',
            type: Sequelize.DATE,
            allowNull: false,
          },
          keyCreationDate: {
            field: 'key_creation_date',
            type: Sequelize.DATE,
            allowNull: false,
          },
          keyOwnershipDate: {
            field: 'key_ownership_date',
            type: Sequelize.DATE,
            allowNull: true,
          },
          claimRequestDate: {
            field: 'claim_request_date',
            type: Sequelize.DATE,
            allowNull: true,
          },
          endToEndId: {
            field: 'end_to_end_id',
            type: Sequelize.STRING,
            allowNull: true,
          },
          cidId: {
            field: 'cid_id',
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          dictAccountId: {
            field: 'dict_account_id',
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          state: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          requestId: {
            field: 'request_id',
            type: Sequelize.STRING,
            allowNull: false,
          },
          userId: {
            field: 'user_id',
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
      await queryInterface.dropTable('pix_decoded_keys', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
