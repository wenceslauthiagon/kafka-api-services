module.exports = {
  up: async (queryInterface) => {
    return await queryInterface.addIndex(
      'users_limits_tracker',
      ['user_limit_id'],
      {
        unique: true,
        name: 'users_limits_tracker_user_limit_id_key',
      },
    );
  },
  down: (queryInterface) => {
    return queryInterface.removeIndex(
      'users_limits_tracker',
      'users_limits_tracker_user_limit_id_key',
    );
  },
};
