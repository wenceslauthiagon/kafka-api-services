'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeConstraint(
      'Notifications',
      'Notifications_user_id_fkey',
    );
  },
  down: async () => console.log('Nothing to do.'),
};
