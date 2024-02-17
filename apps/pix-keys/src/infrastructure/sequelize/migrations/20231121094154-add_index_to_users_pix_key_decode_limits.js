'use strict';

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    await queryInterface.removeIndex(
      'users_pix_key_decode_limits',
      'users_pix_key_decode_limits_user_id_key',
    );

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'users_pix_key_decode_limits',
      },
      ['user_id'],
      {
        transaction,
        name: 'users_pix_key_decode_limits_user_id_key',
        unique: true,
      },
    );
  },
  down: async (queryInterface) => {
    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'users_pix_key_decode_limits',
      },
      'users_pix_key_decode_limits_user_id_key',
      { transaction },
    );
  },
};
