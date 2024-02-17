'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'users_withdraws_settings_requests',
        'pix_key_document',
        {
          field: 'pix_key_document',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'users_withdraws_settings_requests',
        'decoded_pix_key_ispb',
        {
          field: 'decoded_pix_key_ispb',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'users_withdraws_settings_requests',
        'decoded_pix_key_branch',
        {
          field: 'decoded_pix_key_branch',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'users_withdraws_settings_requests',
        'decoded_pix_key_account_number',
        {
          field: 'decoded_pix_key_account_number',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'users_withdraws_settings_requests',
        'decoded_pix_key_name',
        {
          field: 'decoded_pix_key_name',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'users_withdraws_settings_requests',
        'decoded_pix_key_document',
        {
          field: 'decoded_pix_key_document',
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'users_withdraws_settings_requests',
        'decoded_pix_key_created_at',
        {
          field: 'decoded_pix_key_created_at',
          type: Sequelize.DATE,
          allowNull: true,
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
      await queryInterface.removeColumn(
        'users_withdraws_settings_requests',
        'pix_key_document',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'users_withdraws_settings_requests',
        'decoded_pix_key_ispb',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'users_withdraws_settings_requests',
        'decoded_pix_key_branch',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'users_withdraws_settings_requests',
        'decoded_pix_key_account_number',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'users_withdraws_settings_requests',
        'decoded_pix_key_name',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'users_withdraws_settings_requests',
        'decoded_pix_key_document',
        {
          transaction,
        },
      );

      await queryInterface.removeColumn(
        'users_withdraws_settings_requests',
        'decoded_pix_key_created_at',
        {
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
