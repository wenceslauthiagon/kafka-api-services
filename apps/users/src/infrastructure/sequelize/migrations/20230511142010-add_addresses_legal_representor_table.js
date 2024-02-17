'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('addresses_legal_representor', {
        id: {
          field: 'id',
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        userLegalRepresentorId: {
          field: 'user_legal_representor_id',
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users_legal_representor',
            key: 'id',
          },
        },
        zipCode: {
          field: 'zip_code',
          type: Sequelize.STRING,
          allowNull: false,
        },
        street: {
          field: 'street',
          type: Sequelize.STRING,
          allowNull: false,
        },
        number: {
          field: 'number',
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        neighborhood: {
          field: 'neighborhood',
          type: Sequelize.STRING,
          allowNull: false,
        },
        city: {
          field: 'city',
          type: Sequelize.STRING,
          allowNull: false,
        },
        federativeUnit: {
          field: 'federative_unit',
          type: Sequelize.STRING,
          allowNull: false,
        },
        country: {
          field: 'country',
          type: Sequelize.STRING,
          allowNull: false,
        },
        complement: {
          field: 'complement',
          type: Sequelize.STRING,
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
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('addresses_legal_representor', {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
