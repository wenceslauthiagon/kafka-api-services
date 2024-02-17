'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('users_forgot_passwords', {
        id: {
          field: 'id',
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        state: {
          field: 'state',
          type: Sequelize.STRING,
          allowNull: false,
        },
        userUuid: {
          field: 'user_id',
          type: Sequelize.UUID,
          allowNull: false,
        },
        phoneNumber: {
          field: 'phone_number',
          type: Sequelize.STRING,
          allowNull: false,
        },
        code: {
          field: 'code',
          type: Sequelize.STRING,
          allowNull: false,
        },
        attempts: {
          field: 'attempts',
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        expiredAt: {
          field: 'expired_at',
          type: Sequelize.DATE,
          allowNull: true,
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
      });

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
      await queryInterface.dropTable('users_forgot_passwords', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
