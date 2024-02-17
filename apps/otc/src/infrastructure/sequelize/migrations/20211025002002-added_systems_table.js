'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('systems', {
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
        unique: true,
      },
      description: {
        field: 'description',
        type: Sequelize.TEXT,
        allowNull: true,
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
    return queryInterface.dropTable('systems');
  },
};
