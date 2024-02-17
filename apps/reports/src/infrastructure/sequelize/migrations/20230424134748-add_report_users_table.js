'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'report_users',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          userFullName: {
            field: 'user_full_name',
            type: Sequelize.STRING,
          },
          userPhoneNumber: {
            field: 'user_phone_number',
            type: Sequelize.STRING,
            allowNull: false,
          },
          userDocument: {
            field: 'user_document',
            type: Sequelize.STRING,
            allowNull: false,
          },
          userDeletedAt: {
            field: 'user_deleted_at',
            type: Sequelize.DATE,
          },
          userUpdatedAt: {
            field: 'user_updated_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          userState: {
            field: 'user_state',
            type: Sequelize.STRING,
            allowNull: false,
          },
          userEmail: {
            field: 'user_email',
            type: Sequelize.STRING,
          },
          addressStreet: {
            field: 'address_street',
            type: Sequelize.STRING,
          },
          addressNumber: {
            field: 'address_number',
            type: Sequelize.STRING,
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
            allowNull: false,
          },
          addressZipCode: {
            field: 'address_zip_code',
            type: Sequelize.STRING,
          },
          addressComplement: {
            field: 'address_complement',
            type: Sequelize.STRING,
          },
          onboardingUpdatedAt: {
            field: 'onboarding_updated_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          adminName: {
            field: 'admin_name',
            type: Sequelize.STRING,
          },
          userDailyLimit: {
            field: 'user_daily_limit',
            type: Sequelize.BIGINT,
            allowNull: false,
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
      console.error(error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('report_users', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
