'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('taxes', {
      id: {
        field: 'id',
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        field: 'name',
        type: Sequelize.STRING,
        allowNull: false,
        unique: false,
      },
      value: {
        field: 'value',
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      format: {
        field: 'format',
        type: Sequelize.STRING,
        allowNull: false,
        unique: false,
      },
      created_at: {
        field: 'created_at',
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        field: 'updated_at',
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('taxes');
  },
};
