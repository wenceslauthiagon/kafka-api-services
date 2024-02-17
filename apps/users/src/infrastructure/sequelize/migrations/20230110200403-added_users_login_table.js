'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('users_login', {
        id: {
          field: 'id',
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        password: {
          field: 'password',
          type: Sequelize.STRING,
          allowNull: false,
        },
        pin: {
          field: 'pin',
          type: Sequelize.STRING,
          allowNull: false,
        },
        hasPin: {
          field: 'has_pin',
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        document: {
          field: 'document',
          type: Sequelize.STRING,
          allowNull: true,
        },
        name: {
          field: 'name',
          type: Sequelize.STRING,
          allowNull: true,
        },
        fullName: {
          field: 'full_name',
          type: Sequelize.STRING,
          allowNull: true,
        },
        phoneNumber: {
          field: 'phone_number',
          type: Sequelize.STRING,
          allowNull: false,
        },
        email: {
          field: 'email',
          type: Sequelize.STRING,
          allowNull: true,
        },
        active: {
          field: 'active',
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        pinRecovery: {
          field: 'pin_recovery',
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        defaultWalletId: {
          field: 'default_wallet_id',
          type: Sequelize.UUID,
          allowNull: true,
        },
        createdAt: {
          field: 'created_at',
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
        },
        updatedAt: {
          field: 'updated_at',
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
        },
        deletedAt: {
          field: 'deleted_at',
          type: Sequelize.DATE,
          allowNull: true,
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
      await queryInterface.dropTable('users_login', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
