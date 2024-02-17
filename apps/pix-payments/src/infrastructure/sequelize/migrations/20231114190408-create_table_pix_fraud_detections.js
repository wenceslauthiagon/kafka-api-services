'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_fraud_detections',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          externalId: {
            field: 'external_id',
            type: Sequelize.UUID,
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
          fraudType: {
            field: 'fraud_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          key: {
            type: Sequelize.STRING,
          },
          status: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          state: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          issueId: {
            field: 'issue_id',
            type: Sequelize.INTEGER,
          },
          failedCode: {
            field: 'failed_code',
            type: Sequelize.STRING,
          },
          failedMessage: {
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
      await queryInterface.dropTable('pix_fraud_detections', {
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
