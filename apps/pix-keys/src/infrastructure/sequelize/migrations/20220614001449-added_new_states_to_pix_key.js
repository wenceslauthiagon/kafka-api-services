'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.changeColumn(
        'pix_keys',
        'state',
        { type: Sequelize.TEXT, allowNull: false },
        { transaction },
      );

      await queryInterface.dropEnum('enum_pix_keys_state', { transaction });

      await queryInterface.changeColumn(
        'pix_keys',
        'state',
        {
          type: Sequelize.ENUM(
            'PENDING',
            'CONFIRMED',
            'NOT_CONFIRMED',
            'ADD_KEY_READY',
            'READY',
            'CANCELED',
            'ERROR',
            'DELETING',
            'DELETED',
            'DELETED_ERROR',
            'PORTABILITY_PENDING',
            'PORTABILITY_OPENED',
            'PORTABILITY_STARTED',
            'PORTABILITY_READY',
            'PORTABILITY_CONFIRMED',
            'PORTABILITY_CANCELED',
            'PORTABILITY_REQUEST_PENDING',
            'PORTABILITY_REQUEST_CANCEL_OPENED',
            'PORTABILITY_REQUEST_CANCEL_STARTED',
            'PORTABILITY_REQUEST_CONFIRM_OPENED',
            'PORTABILITY_REQUEST_CONFIRM_STARTED',
            'PORTABILITY_REQUEST_AUTO_CONFIRMED', // Topazio has automatic portability confirmation.
            'OWNERSHIP_PENDING',
            'OWNERSHIP_OPENED',
            'OWNERSHIP_STARTED',
            'OWNERSHIP_CONFIRMED',
            'OWNERSHIP_READY',
            'OWNERSHIP_CANCELED',
            'OWNERSHIP_WAITING',
            'CLAIM_NOT_CONFIRMED',
            'CLAIM_PENDING',
            'CLAIM_CLOSING',
            'CLAIM_DENIED',
            'CLAIM_CLOSED',
          ),
          allowNull: false,
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
  down: async () => console.log('Nothing to do.'),
};
