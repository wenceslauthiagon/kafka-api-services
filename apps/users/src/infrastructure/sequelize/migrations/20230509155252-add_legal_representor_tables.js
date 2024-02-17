'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('users_legal_representor', {
        id: {
          field: 'id',
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        userId: {
          field: 'user_id',
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'uuid',
          },
        },
        addressId: {
          field: 'address_id',
          type: Sequelize.UUID,
          allowNull: true,
        },
        personType: {
          field: 'person_type',
          type: Sequelize.STRING,
          allowNull: false,
        },
        document: {
          field: 'document',
          type: Sequelize.STRING,
          allowNull: false,
        },
        name: {
          field: 'name',
          type: Sequelize.STRING,
          allowNull: false,
        },
        birthDate: {
          field: 'birth_date',
          type: Sequelize.DATE,
          allowNull: false,
        },
        type: {
          field: 'type',
          type: Sequelize.STRING,
          allowNull: false,
        },
        isPublicServer: {
          field: 'is_public_server',
          type: Sequelize.BOOLEAN,
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
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('users_legal_representor', {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
