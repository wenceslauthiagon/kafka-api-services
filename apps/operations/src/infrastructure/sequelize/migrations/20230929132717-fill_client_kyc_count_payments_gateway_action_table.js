const { v4: uuidV4 } = require('uuid');

const PERMISSION_TYPE_CLIENT_TAG = 'CLIENT';
const PERMISSION_TYPE_ADMIN_TAG = 'ADMIN';
const action = {
  tag: 'api-users-get-payments-gateway-client-kyc-count',
  description: 'Get validation client kyc count file',
};

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert(
        'permission_actions',
        [
          {
            ...action,
            id: uuidV4(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'permission_type_actions',
        [
          {
            id: uuidV4(),
            permission_type_tag: PERMISSION_TYPE_CLIENT_TAG,
            permission_action_tag: action.tag,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: uuidV4(),
            permission_type_tag: PERMISSION_TYPE_ADMIN_TAG,
            permission_action_tag: action.tag,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const Op = Sequelize.Op;

    try {
      await queryInterface.bulkDelete(
        'permission_type_actions',
        {
          permission_action_tag: action.tag,
          permission_type_tag: {
            [Op.in]: [PERMISSION_TYPE_CLIENT_TAG, PERMISSION_TYPE_ADMIN_TAG],
          },
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'permission_actions',
        { tag: action.tag },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
