'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'bank_teds',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4,
          },
          ispb: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
          },
          code: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          fullName: {
            field: 'full_name',
            type: Sequelize.STRING,
            allowNull: false,
          },
          active: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          startedAt: {
            field: 'started_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          createdAt: {
            field: 'created_at',
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Date.now(),
          },
          updatedAt: {
            field: 'updated_at',
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Date.now(),
          },
          deletedAt: {
            field: 'deleted_at',
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

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('bank_teds', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
