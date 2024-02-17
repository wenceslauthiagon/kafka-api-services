'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'retries',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4,
          },
          counter: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          retry_queue: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          fail_queue: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          retry_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          abort_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          data: {
            type: Sequelize.JSONB,
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },
          deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
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
      await queryInterface.dropTable('retries', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
