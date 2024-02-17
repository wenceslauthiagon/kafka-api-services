'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addIndex('Addresses', ['user_id'], {
        transaction,
        name: 'Addresses_user_id_key',
      });

      await queryInterface.addIndex('Onboardings', ['user_id'], {
        transaction,
        name: 'Onboardings_user_id_key',
      });

      await queryInterface.addIndex('Onboardings', ['status'], {
        transaction,
        name: 'Onboardings_status_key',
      });

      await queryInterface.addIndex(
        'Onboardings',
        ['topazio_account_number', 'status'],
        {
          transaction,
          name: 'Onboardings_topazio_account_number_status_key',
        },
      );

      await queryInterface.addIndex(
        'Onboardings',
        ['user_id', 'discarded_at'],
        {
          transaction,
          name: 'Onboardings_user_id_discarded_at_key',
        },
      );

      await queryInterface.addIndex('Onboardings', ['cpf', 'status'], {
        transaction,
        name: 'Onboardings_cpf_status_key',
      });

      await queryInterface.addIndex('users_api_keys', ['user_id'], {
        transaction,
        name: 'users_api_keys_user_id_key',
      });

      await queryInterface.addIndex(
        'users_forgot_passwords',
        ['state', 'user_id'],
        {
          transaction,
          name: 'users_forgot_passwords_state_user_id_key',
        },
      );

      await queryInterface.addIndex(
        'users_forgot_passwords',
        ['id', 'user_id'],
        {
          transaction,
          name: 'users_forgot_passwords_id_user_id_key',
        },
      );

      await queryInterface.addIndex(
        'users_forgot_passwords',
        ['created_at', 'state'],
        {
          transaction,
          name: 'users_forgot_passwords_created_at_state_key',
        },
      );

      await queryInterface.addIndex(
        'users_legal_additional_info',
        ['user_id'],
        {
          transaction,
          name: 'users_legal_additional_info_user_id_key',
        },
      );

      await queryInterface.addIndex('users_legal_representor', ['user_id'], {
        transaction,
        name: 'users_legal_representor_user_id_key',
      });

      await queryInterface.addIndex('Users_pin_attempts', ['user_id'], {
        transaction,
        name: 'Users_pin_attempts_user_id_key',
      });

      await queryInterface.addIndex('Users', ['cpf'], {
        transaction,
        name: 'Users_cpf_key',
      });

      await queryInterface.addIndex('Users', ['referral_code'], {
        transaction,
        name: 'Users_referral_code_key',
      });

      await queryInterface.addIndex('Users', ['state', 'created_at'], {
        transaction,
        name: 'Users_state_created_at_key',
      });

      await queryInterface.addIndex(
        'Users',
        ['state', 'bank_onboarding_state'],
        {
          transaction,
          name: 'Users_state_bank_onboarding_state_key',
        },
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
      await queryInterface.removeIndex('Addresses', 'Addresses_user_id_key', {
        transaction,
      });

      await queryInterface.removeIndex(
        'Onboardings',
        'Onboardings_user_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'Onboardings',
        'Onboardings_status_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'Onboardings',
        'Onboardings_topazio_account_number_status_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'Onboardings',
        'Onboardings_user_id_discarded_at_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'Onboardings',
        'Onboardings_cpf_status_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'users_api_keys',
        'users_api_keys_user_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'users_forgot_passwords',
        'users_forgot_passwords_state_user_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'users_forgot_passwords',
        'users_forgot_passwords_id_user_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'users_forgot_passwords',
        'users_forgot_passwords_created_at_state_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'users_legal_additional_info',
        'users_legal_additional_info_user_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'users_legal_representor',
        'users_legal_representor_user_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'Users_pin_attempts',
        'Users_pin_attempts_user_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex('Users', 'Users_cpf_key', {
        transaction,
      });

      await queryInterface.removeIndex('Users', 'Users_referral_code_key', {
        transaction,
      });

      await queryInterface.removeIndex('Users', 'Users_state_created_at_key', {
        transaction,
      });

      await queryInterface.removeIndex(
        'Users',
        'Users_state_bank_onboarding_state_key',
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
