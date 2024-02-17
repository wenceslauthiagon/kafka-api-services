'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'cities',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.UUIDV4,
          },
          code: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          federativeUnitCode: {
            field: 'federative_unit_code',
            type: Sequelize.STRING,
            allowNull: false,
          },
          federativeUnitName: {
            field: 'federative_unit_name',
            type: Sequelize.STRING,
            allowNull: false,
          },
          federativeUnitAcronym: {
            field: 'federative_unit_acronym',
            type: Sequelize.STRING,
            allowNull: false,
          },
          regionCode: {
            field: 'region_code',
            type: Sequelize.STRING,
            allowNull: false,
          },
          regionName: {
            field: 'region_name',
            type: Sequelize.STRING,
            allowNull: false,
          },
          regionAcronym: {
            field: 'region_acronym',
            type: Sequelize.STRING,
            allowNull: false,
          },
          active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
      await queryInterface.dropTable('cities', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
