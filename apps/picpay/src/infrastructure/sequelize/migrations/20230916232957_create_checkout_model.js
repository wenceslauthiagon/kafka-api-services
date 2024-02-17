'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'checkouts_picpay',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          status: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          referenceId: {
            type: Sequelize.STRING,
            field: 'reference_id',
            allowNull: true,
          },
          authorizationId: {
            type: Sequelize.STRING,
            field: 'authorization_id',
            allowNull: true,
          },
          destination: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          requesterName: {
            type: Sequelize.STRING,
            field: 'requester_name',
            allowNull: false,
          },
          requesterDocument: {
            type: Sequelize.STRING,
            field: 'requester_document',
            allowNull: false,
          },
          requesterContact: {
            type: Sequelize.STRING,
            field: 'requester_contact',
            allowNull: false,
          },
          payload: {
            type: Sequelize.JSONB,
            allowNull: true,
          },
          amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
          },
          currency: {
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
          expiresAt: {
            type: Sequelize.DATE,
            field: 'expires_at',
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
      await queryInterface.dropTable('checkouts_picpay', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
