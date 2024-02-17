'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addIndex('pix_decoded_keys', ['user_id'], {
        transaction,
        name: 'pix_decoded_keys_user_id_key',
      });

      await queryInterface.addIndex(
        'pix_decoded_keys',
        ['user_id', 'end_to_end_id'],
        {
          transaction,
          name: 'pix_decoded_keys_user_id_end_to_end_id_key',
        },
      );

      await queryInterface.addIndex(
        'pix_decoded_keys',
        ['user_id', 'created_at', 'state'],
        {
          transaction,
          name: 'pix_decoded_keys_user_id_created_at_state_key',
        },
      );

      await queryInterface.addIndex('pix_key_decode_limits', ['person_type'], {
        transaction,
        name: 'pix_key_decode_limits_person_type_key',
      });

      await queryInterface.addIndex(
        'pix_key_histories',
        ['pix_key_id', 'state', 'created_at', 'updated_at'],
        {
          transaction,
          name: 'pix_key_histories_pix_key_id_state_created_at_updated_at_key',
        },
      );

      await queryInterface.addIndex('pix_key_verifications', ['pix_key_id'], {
        transaction,
        name: 'pix_key_verifications_pix_key_id_key',
      });

      await queryInterface.addIndex('pix_keys', ['id', 'state'], {
        transaction,
        name: 'pix_keys_id_state_key',
      });

      await queryInterface.addIndex('pix_keys', ['key', 'state'], {
        transaction,
        name: 'pix_keys_key_state_key',
      });

      await queryInterface.addIndex('pix_keys', ['key', 'state', 'user_id'], {
        transaction,
        name: 'pix_keys_key_state_user_id_key',
      });

      await queryInterface.addIndex('pix_keys', ['user_id', 'state'], {
        transaction,
        name: 'pix_keys_user_id_state_key',
      });

      await queryInterface.addIndex('pix_keys', ['id', 'user_id', 'state'], {
        transaction,
        name: 'pix_keys_id_user_id_state_key',
      });

      await queryInterface.addIndex('pix_keys', ['updated_at', 'state'], {
        transaction,
        name: 'pix_keys_updated_at_state_key',
      });

      await queryInterface.addIndex(
        'users_pix_key_decode_limits',
        ['user_id'],
        {
          transaction,
          name: 'users_pix_key_decode_limits_user_id_key',
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
      await queryInterface.removeIndex(
        'pix_decoded_keys',
        'pix_decoded_keys_user_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_decoded_keys',
        'pix_decoded_keys_user_id_end_to_end_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_decoded_keys',
        'pix_decoded_keys_user_id_created_at_state_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_key_decode_limits',
        'pix_key_decode_limits_person_type_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_key_histories',
        'pix_key_histories_pix_key_id_state_created_at_updated_at_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_key_verifications',
        'pix_key_verifications_pix_key_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex('pix_keys', 'pix_keys_id_state_key', {
        transaction,
      });

      await queryInterface.removeIndex('pix_keys', 'pix_keys_key_state_key', {
        transaction,
      });

      await queryInterface.removeIndex(
        'pix_keys',
        'pix_keys_key_state_user_id_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_keys',
        'pix_keys_user_id_state_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_keys',
        'pix_keys_id_user_id_state_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'pix_keys',
        'pix_keys_updated_at_state_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'users_pix_key_decode_limits',
        'users_pix_key_decode_limits_user_id_key',
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
