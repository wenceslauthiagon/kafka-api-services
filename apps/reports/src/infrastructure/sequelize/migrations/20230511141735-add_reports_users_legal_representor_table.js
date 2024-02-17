'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'report_users_legal_representor',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          userLegalRepresentorId: {
            field: 'user_legal_representor_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          personType: {
            field: 'person_type',
            type: Sequelize.STRING,
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
          userLegalRepresentorCreatedAt: {
            field: 'user_legal_representor_created_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          userLegalRepresentorUpdatedAt: {
            field: 'user_legal_representor_updated_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          userDocument: {
            field: 'user_document',
            type: Sequelize.STRING,
            allowNull: false,
          },
          addressZipCode: {
            field: 'address_zip_code',
            type: Sequelize.STRING,
            allowNull: false,
          },
          addressStreet: {
            field: 'address_street',
            type: Sequelize.STRING,
            allowNull: false,
          },
          addressNumber: {
            field: 'address_number',
            type: Sequelize.STRING,
            allowNull: false,
          },
          addressNeighborhood: {
            field: 'address_neighborhood',
            type: Sequelize.STRING,
            allowNull: false,
          },
          addressCity: {
            field: 'address_city',
            type: Sequelize.STRING,
            allowNull: false,
          },
          addressFederativeUnit: {
            field: 'address_federative_unit',
            type: Sequelize.STRING,
            allowNull: false,
          },
          addressCountry: {
            field: 'address_country',
            type: Sequelize.STRING,
          },
          addressComplement: {
            field: 'address_complement',
            type: Sequelize.STRING,
          },
          createdAt: {
            field: 'created_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          updatedAt: {
            field: 'updated_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('report_users_legal_representor', {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
