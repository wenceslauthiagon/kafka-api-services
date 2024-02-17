const { v4: uuidV4 } = require('uuid');

const PERMISSION_TYPE_TAG = 'ROOT';

const actions = [
  'api-users-post-auth-change-password',
  'api-users-delete-auth-forgot-password-by-id',
  'api-users-post-auth-verify-pin',
  'api-users-post-limit-request',
  'api-users-post-withdraw-setting-request',
  'api-users-get-withdraw-setting-request-by-id',
  'api-users-post-pix-keys-by-id-claims-start',
  'api-users-post-pix-keys-by-id-portabilities-approve',
  'api-users-post-pix-keys-by-id-portabilities-start',
  'api-users-delete-pix-keys-by-id-code',
  'api-users-delete-pix-keys-by-id-portabilities-approve',
  'api-users-delete-pix-keys-by-id-claim-start',
  'api-users-delete-pix-keys-by-id-portabilities-start',
  'api-users-get-pix-keys-decode-by-key',
  'api-users-post-pix-keys',
  'api-users-delete-pix-keys-by-id',
  'api-users-post-pix-keys-dismiss-by-id',
  'api-users-get-pix-keys',
  'api-users-get-pix-keys-by-id',
  'api-users-get-pix-keys-by-id-code',
  'api-users-post-pix-keys-verify-code-by-id',
  'api-users-get-pix-payments-receipt-by-operation-id',
  'api-users-delete-pix-payments-by-operation-id',
  'api-users-get-pix-payments-decode',
  'api-users-get-pix-payments-by-id',
  'api-users-post-pix-payments-by-account-instant-billing',
  'api-users-post-pix-payments-by-qr-code-static-instant-billing',
  'api-users-post-pix-payments-by-qr-code-static-withdrawal',
  'api-users-post-pix-payments-by-qr-code-dynamic-instant-billing',
  'api-users-post-pix-payments-by-qr-code-dynamic-withdrawal',
  'api-users-post-pix-payments-by-qr-code-dynamic-due-date-billing',
  'api-users-post-pix-payments-by-qr-code-dynamic-change',
  'api-users-post-pix-payments-decode-by-account',
  'api-users-post-pix-payments-by-key-instant-billing',
  'api-users-get-pix-deposits-by-operation-id',
  'api-users-get-pix-deposits-qr-codes',
  'api-users-post-pix-deposits-qr-codes',
  'api-users-get-pix-deposits-qr-codes-by-id',
  'api-users-delete-pix-deposits-qr-codes-by-id',
  'api-users-post-pix-deposits-qr-codes-dynamic-instant-billing',
  'api-users-post-pix-deposits-qr-codes-dynamic-due-date',
  'api-users-post-pix-deposits-qr-codes-dynamic-withdrawal',
  'api-users-post-pix-deposits-qr-codes-dynamic-change',
  'api-users-get-pix-deposits-qr-codes-dynamic-by-id',
  'api-users-get-pix-devolutions-by-id',
  'api-users-post-pix-devolutions',
  'api-users-get-pix-devolutions',
  'api-users-get-pix-devolutions-received',
  'api-users-get-pix-devolutions-received-by-id',
  'api-users-post-pix-warning-pix-devolution',
  'api-users-get-banking-banks',
  'api-users-get-banking-ted-banks',
  'api-users-get-banking-ted',
  'api-users-post-banking-ted',
  'api-users-get-banking-ted-by-id',
  'api-users-post-operations-p2p-transfers',
  'api-users-patch-limit-users',
  'api-users-get-limit-users',
  'api-users-get-limit-types',
  'api-users-post-operations-wallets',
  'api-users-get-operations-wallets',
  'api-users-put-operations-wallets-by-id',
  'api-users-delete-operations-wallets-by-id',
  'api-users-get-operations-wallets-by-id',
  'api-users-delete-operations-permissions-by-wallet-id',
  'api-users-get-operations-permissions-by-wallet-id',
  'api-users-delete-operations-permissions-by-wallet-id-and-user-id',
  'api-users-patch-operations-permissions-by-wallet-id-and-user-id',
  'api-users-get-operations-wallet-accounts',
  'api-users-get-operations-wallet-accounts-by-id',
  'api-users-get-operations-currencies',
  'api-users-get-operations',
  'api-users-get-operations-by-id',
  'api-users-get-operations-receipt-by-id',
  'api-users-get-operations-wallet-invitations-user',
  'api-users-post-operations-wallet-invitations',
  'api-users-get-operations-wallet-invitations-my',
  'api-users-put-operations-wallet-invitations-accept',
  'api-users-put-operations-wallet-invitations-decline',
  'api-users-delete-operations-wallet-invitations-by-id',
  'api-users-get-quotations-trends',
  'api-users-get-quotations-spot',
  'api-users-post-conversions',
  'api-users-get-conversions',
  'api-users-get-payments-gateway-deposits-by-id',
  'api-users-get-payments-gateway-deposits',
  'api-users-get-payments-gateway-company',
  'api-users-get-payments-gateway-devolutions',
  'api-users-get-payments-gateway-devolutions-by-id',
  'api-users-get-payments-gateway-orders-by-id',
  'api-users-get-payments-gateway-orders',
  'api-users-get-payments-gateway-withdrawals-by-id',
  'api-users-get-payments-gateway-withdrawals',
  'api-users-get-payments-gateway-refunds-by-id',
  'api-users-get-payments-gateway-refunds',
  'api-users-post-payments-gateway-check-wallets',
  'api-users-get-users-has-pin',
  'api-users-patch-users-pin',
  'api-users-put-users-pin',
  'api-users-get-pix-payments',
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const action_ids = await queryInterface.sequelize.query(
        `SELECT id FROM "permission_type_actions"
          WHERE permission_action_tag IN (:action)
            AND permission_type_tag='${PERMISSION_TYPE_TAG}'`,
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { action: actions },
        },
      );

      if (action_ids.length) return;

      await queryInterface.bulkInsert(
        'permission_type_actions',
        actions.map((tag) => ({
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
          permission_action_tag: { [Op.in]: actions },
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
