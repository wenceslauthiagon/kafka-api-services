'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'webhooks',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          targetUrl: {
            field: 'target_url',
            allowNull: false,
            type: Sequelize.STRING,
          },
          type: {
            allowNull: false,
            type: Sequelize.STRING,
          },
          accountNumber: {
            field: 'account_number',
            allowNull: false,
            type: Sequelize.STRING,
          },
          agencyNumber: {
            field: 'agency_number',
            allowNull: false,
            type: Sequelize.STRING,
          },
          userId: {
            field: 'user_id',
            allowNull: false,
            type: Sequelize.UUID,
          },
          apiKey: {
            field: 'api_key',
            allowNull: false,
            type: Sequelize.STRING,
          },
          state: {
            allowNull: false,
            type: Sequelize.STRING,
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
      await queryInterface.dropTable('webhooks', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
