const { v4: uuidV4 } = require('uuid');

const PERMISSION_TYPE_TAG = 'ADMIN';
const oldActions = [
  'get-operations-currencies',
  'get-operations',
  'get-operations-by-id',
  'get-operations-receipt-by-id',
  'post-operations-p2p-transfers',
  'get-operations-wallets',
  'get-operations-wallets-by-id',
  'get-operations-wallet-accounts',
  'get-operations-wallet-accounts-by-id',
  'delete-operations-permissions-by-wallet-id',
  'get-operations-permissions-by-wallet-id',
  'post-payments-gateway-check-wallets',
  'get-payments-gateway-company',
  'get-payments-gateway-deposits-by-id',
  'get-payments-gateway-deposits',
  'get-payments-gateway-devolutions-by-id',
  'get-payments-gateway-devolutions',
  'get-payments-gateway-orders-by-id',
  'get-payments-gateway-orders',
  'get-payments-gateway-refunds-by-id',
  'get-payments-gateway-refunds',
  'get-payments-gateway-withdrawals-by-id',
  'get-payments-gateway-withdrawals',
  'get-pix-keys-decode-by-key',
  'get-pix-payments-receipt-by-operation-id',
  'delete-pix-payments-by-operation-id',
  'get-pix-payments-decode',
  'get-pix-payments-by-id',
  'post-pix-payments-by-account-instant-billing',
  'post-pix-payments-by-qr-code-static-instant-billing',
  'post-pix-payments-by-qr-code-static-withdrawal',
  'post-pix-payments-by-qr-code-dynamic-instant-billing',
  'post-pix-payments-by-qr-code-dynamic-withdrawal',
  'post-pix-payments-by-qr-code-dynamic-due-date-billing',
  'post-pix-payments-by-qr-code-dynamic-change',
  'post-pix-payments-decode-by-account',
  'post-pix-payments-by-key-instant-billing',
  'get-pix-deposits-by-operation-id',
  'get-pix-devolutions-by-id',
  'get-pix-devolutions',
  'get-pix-devolutions-received',
  'get-pix-devolutions-received-by-id',
  'get-pix-payments',
];

const fullActions = oldActions.map((tag) => `api-users-${tag}`);

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const Op = Sequelize.Op;

    try {
      // Delete old action names to reinsert new names.
      await queryInterface.bulkDelete(
        'permission_type_actions',
        {
          permission_type_tag: PERMISSION_TYPE_TAG,
          permission_action_tag: { [Op.in]: oldActions },
        },
        { transaction },
      );

      const action_ids = await queryInterface.sequelize.query(
        `SELECT id FROM "permission_type_actions"
          WHERE permission_action_tag IN (:action)
            AND permission_type_tag='${PERMISSION_TYPE_TAG}'`,
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { action: fullActions },
        },
      );

      if (action_ids.length) return;

      await queryInterface.bulkInsert(
        'permission_type_actions',
        fullActions.map((tag) => ({
          id: uuidV4(),
          permission_type_tag: PERMISSION_TYPE_TAG,
          permission_action_tag: tag,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
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
          permission_type_tag: PERMISSION_TYPE_TAG,
          permission_action_tag: { [Op.in]: fullActions },
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
};
