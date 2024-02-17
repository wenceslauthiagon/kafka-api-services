const { v4: uuidV4 } = require('uuid');

const oldActions = [
  'post-auth-change-password',
  'delete-auth-forgot-password-by-id',
  'post-auth-verify-pin',
  'post-limit-request',
  'post-withdraw-setting-request',
  'get-withdraw-setting-request-by-id',
  'post-pix-keys-by-id-claims-start',
  'post-pix-keys-by-id-portabilities-approve',
  'post-pix-keys-by-id-portabilities-start',
  'delete-pix-keys-by-id-code',
  'delete-pix-keys-by-id-portabilities-approve',
  'delete-pix-keys-by-id-claim-start',
  'delete-pix-keys-by-id-portabilities-start',
  'get-pix-keys-decode',
  'post-pix-keys',
  'delete-pix-keys-by-id',
  'post-pix-keys-dismiss-by-id',
  'get-pix-keys',
  'get-pix-keys-by-id',
  'get-pix-keys-by-id-code',
  'post-pix-keys-verify-code-by-id',
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
  'post-pix-payment-decode-by-account',
  'get-pix-payment-decode-by-key',
  'post-pix-payments-by-key-instant-billing',
  'get-pix-deposits',
  'get-pix-deposits-by-id',
  'get-pix-deposits-qr-codes',
  'post-pix-deposits-qr-codes',
  'get-pix-deposits-qr-codes-by-id',
  'delete-pix-deposits-qr-codes-by-id',
  'post-pix-deposits-qr-codes-dynamic-instant-billing',
  'post-pix-deposits-qr-codes-dynamic-due-date',
  'post-pix-deposits-qr-codes-dynamic-withdrawal',
  'post-pix-deposits-qr-codes-dynamic-change',
  'get-pix-deposits-qr-codes-dynamic-by-id',
  'get-pix-devolutions-by-id',
  'post-pix-devolutions',
  'get-pix-devolutions',
  'get-pix-devolutions-received',
  'get-pix-devolutions-received-by-id',
  'post-pix-warning-pix-devolution',
  'get-pix-statements',
  'get-banking-banks',
  'get-banking-ted-banks',
  'get-banking-ted',
  'post-banking-ted',
  'get-banking-ted-by-id',
  'post-operations-p2p-transfers',
  'patch-limit-users',
  'get-limit-users',
  'get-limit-types',
  'post-operations-wallets',
  'get-operations-wallets',
  'put-operations-wallets-by-id',
  'delete-operations-wallets-by-id',
  'get-operations-wallets-by-id',
  'delete-operations-permissions-by-wallet-id',
  'get-operations-permissions-by-wallet-id',
  'delete-operations-permissions-by-wallet-id-and-user-id',
  'patch-operations-permissions-by-wallet-id-and-user-id',
  'get-operations-wallet-accounts',
  'get-operations-wallet-accounts-by-id',
  'get-operations-currencies',
  'get-operations',
  'get-operations-by-id',
  'get-operations-receipt-by-id',
  'get-operations-wallet-invitations-user',
  'post-operations-wallet-invitations',
  'get-operations-wallet-invitations-my',
  'put-operations-wallet-invitations-accept',
  'put-operations-wallet-invitations-decline',
  'delete-operations-wallet-invitations-by-id',
  'get-quotations-trends',
  'get-quotations-spot',
  'post-conversions',
  'get-conversions',
  'get-payments-gateway-deposits-by-id',
  'get-payments-gateway-deposits',
  'get-payments-gateway-company',
  'get-payments-gateway-devolutions',
  'get-payments-gateway-devolutions-by-id',
  'get-payments-gateway-orders-by-id',
  'get-payments-gateway-orders',
  'get-payments-gateway-withdrawals-by-id',
  'get-payments-gateway-withdrawals',
  'get-payments-gateway-refunds-by-id',
  'get-payments-gateway-refunds',
  'post-payments-gateway-check-wallets',
  'get-users-has-pin',
  'patch-users-pin',
  'put-users-pin',
  'get-pix-payments',
  'post-otc-conversions',
  'get-otc-conversions',
  'get-otc-conversions-credit-balance',
  'get-otc-conversions-quotations-by-id',
  'get-otc-conversions-by-id',
];

const apiUsersActions = [
  {
    tag: 'api-users-post-auth-change-password',
    description: 'Change user password',
  },
  {
    tag: 'api-users-delete-auth-forgot-password-by-id',
    description: 'Decline forgot password',
  },
  {
    tag: 'api-users-post-auth-verify-pin',
    description: 'Verify pin user',
  },
  {
    tag: 'api-users-post-limit-request',
    description: 'Create user limit',
  },
  {
    tag: 'api-users-post-withdraw-setting-request',
    description: 'Create user withdraw settings',
  },
  {
    tag: 'api-users-get-withdraw-setting-request-by-id',
    description: 'Get user withdraw settings',
  },
  {
    tag: 'api-users-post-pix-keys-by-id-claims-start',
    description: 'Approve ownership claim start process',
  },
  {
    tag: 'api-users-post-pix-keys-by-id-portabilities-approve',
    description: 'Approve portability process',
  },
  {
    tag: 'api-users-post-pix-keys-by-id-portabilities-start',
    description: 'Approve portability start process',
  },
  {
    tag: 'api-users-delete-pix-keys-by-id-code',
    description: 'Cancel pix key',
  },
  {
    tag: 'api-users-delete-pix-keys-by-id-portabilities-approve',
    description: 'Cancel portability process',
  },
  {
    tag: 'api-users-delete-pix-keys-by-id-claim-start',
    description: 'Cancel ownership claim start process',
  },
  {
    tag: 'api-users-delete-pix-keys-by-id-portabilities-start',
    description: 'Cancel portability start process',
  },
  {
    tag: 'api-users-get-pix-keys-decode-by-key',
    description: 'Decodes pix key',
  },
  {
    tag: 'api-users-post-pix-keys',
    description: 'Create new random key',
  },
  {
    tag: 'api-users-delete-pix-keys-by-id',
    description: "Delete user's key by id",
  },
  {
    tag: 'api-users-post-pix-keys-dismiss-by-id',
    description: 'Dismiss pix key by ID',
  },
  {
    tag: 'api-users-get-pix-keys',
    description: "List the user's keys",
  },
  {
    tag: 'api-users-get-pix-keys-by-id',
    description: "Get a user's key by id",
  },
  {
    tag: 'api-users-get-pix-keys-by-id-code',
    description: 'Send confirmation code',
  },
  {
    tag: 'api-users-post-pix-keys-verify-code-by-id',
    description: 'Confirm pending key code',
  },
  {
    tag: 'api-users-get-pix-payments-receipt-by-operation-id',
    description: 'Get receipt by its operation id',
  },
  {
    tag: 'api-users-delete-pix-payments-by-operation-id',
    description: 'Cancel payment by operation id',
  },
  {
    tag: 'api-users-get-pix-payments-decode',
    description: 'Decodes QR code by its emv code',
  },
  {
    tag: 'api-users-get-pix-payments-by-id',
    description: 'Get a PIX payment status',
  },
  {
    tag: 'api-users-post-pix-payments-by-account-instant-billing',
    description: 'Create a payment with account',
  },
  {
    tag: 'api-users-post-pix-payments-by-qr-code-static-instant-billing',
    description: 'Create a payment with qr code static',
  },
  {
    tag: 'api-users-post-pix-payments-by-qr-code-static-withdrawal',
    description: 'Withdrawal a payment with qr code static',
  },
  {
    tag: 'api-users-post-pix-payments-by-qr-code-dynamic-instant-billing',
    description: 'Create a payment with qr code dynamic',
  },
  {
    tag: 'api-users-post-pix-payments-by-qr-code-dynamic-withdrawal',
    description: 'Withdrawal a payment with qr code dynamic',
  },
  {
    tag: 'api-users-post-pix-payments-by-qr-code-dynamic-due-date-billing',
    description: 'Duedate a payment with qr code dynamic',
  },
  {
    tag: 'api-users-post-pix-payments-by-qr-code-dynamic-change',
    description: 'Change a payment with qr code dynamic',
  },
  {
    tag: 'api-users-post-pix-payments-decode-by-account',
    description: 'Create new Decoded Pix Account ID',
  },
  {
    tag: 'api-users-post-pix-payments-by-key-instant-billing',
    description: 'Create a payment with pix key',
  },
  {
    tag: 'api-users-get-pix-deposits-by-operation-id',
    description: 'Get pix deposit by operation id',
  },
  {
    tag: 'api-users-get-pix-deposits-qr-codes',
    description: "List user's QR codes",
  },
  {
    tag: 'api-users-post-pix-deposits-qr-codes',
    description: 'Create a static QR Code',
  },
  {
    tag: 'api-users-get-pix-deposits-qr-codes-by-id',
    description: "Get a user's QR code by id",
  },
  {
    tag: 'api-users-delete-pix-deposits-qr-codes-by-id',
    description: "Delete user's QR code",
  },
  {
    tag: 'api-users-post-pix-deposits-qr-codes-dynamic-instant-billing',
    description: 'Create new dynamic QR Code',
  },
  {
    tag: 'api-users-post-pix-deposits-qr-codes-dynamic-due-date',
    description: 'Create a due date dynamic QR Code',
  },
  {
    tag: 'api-users-post-pix-deposits-qr-codes-dynamic-withdrawal',
    description: 'Create a withdrawal dynamic QR Code',
  },
  {
    tag: 'api-users-post-pix-deposits-qr-codes-dynamic-change',
    description: 'Create a change dynamic QR Code',
  },
  {
    tag: 'api-users-get-pix-deposits-qr-codes-dynamic-by-id',
    description: 'Get dynamic QR code by ID',
  },
  {
    tag: 'api-users-get-pix-devolutions-by-id',
    description: 'Get pix devolution by ID',
  },
  {
    tag: 'api-users-post-pix-devolutions',
    description: 'Create new pix devolution',
  },
  {
    tag: 'api-users-get-pix-devolutions',
    description: "List user's pix devolutions",
  },
  {
    tag: 'api-users-get-pix-devolutions-received',
    description: "List user's received pix devolutions",
  },
  {
    tag: 'api-users-get-pix-devolutions-received-by-id',
    description: 'Get received pix devolution by ID',
  },
  {
    tag: 'api-users-post-pix-warning-pix-devolution',
    description: 'Create new warning pix devolution',
  },
  {
    tag: 'api-users-get-banking-banks',
    description: 'List the banks',
  },
  {
    tag: 'api-users-get-banking-ted-banks',
    description: 'List banks that support TED operations',
  },
  {
    tag: 'api-users-get-banking-ted',
    description: "List user's TED operations",
  },
  {
    tag: 'api-users-post-banking-ted',
    description: 'Create new TED operation',
  },
  {
    tag: 'api-users-get-banking-ted-by-id',
    description: 'Get TED operation by ID',
  },
  {
    tag: 'api-users-post-operations-p2p-transfers',
    description: 'Create a P2P transfer',
  },
  {
    tag: 'api-users-patch-limit-users',
    description: 'Update user limit',
  },
  {
    tag: 'api-users-get-limit-users',
    description: 'Get user limits by filter',
  },
  {
    tag: 'api-users-get-limit-types',
    description: 'Get limit types by filter',
  },
  {
    tag: 'api-users-post-operations-wallets',
    description: 'Create a new wallet',
  },
  {
    tag: 'api-users-get-operations-wallets',
    description: "List user's wallets",
  },
  {
    tag: 'api-users-put-operations-wallets-by-id',
    description: 'Update a wallet data',
  },
  {
    tag: 'api-users-delete-operations-wallets-by-id',
    description: 'Delete a wallet by id',
  },
  {
    tag: 'api-users-get-operations-wallets-by-id',
    description: "Get a user's wallet by id",
  },
  {
    tag: 'api-users-delete-operations-permissions-by-wallet-id',
    description: 'Delete a permission that the logged in user can access',
  },
  {
    tag: 'api-users-get-operations-permissions-by-wallet-id',
    description: "Get a user's wallet permissions",
  },
  {
    tag: 'api-users-delete-operations-permissions-by-wallet-id-and-user-id',
    description: 'Delete a permission from the user who owns a wallet',
  },
  {
    tag: 'api-users-patch-operations-permissions-by-wallet-id-and-user-id',
    description: "Update user's wallet permissions",
  },
  {
    tag: 'api-users-get-operations-wallet-accounts',
    description: "List user's wallet accounts",
  },
  {
    tag: 'api-users-get-operations-wallet-accounts-by-id',
    description: "Get user's wallet account by id",
  },
  {
    tag: 'api-users-get-operations-currencies',
    description: 'Get a list of currencies',
  },
  {
    tag: 'api-users-get-operations',
    description: "List user's operations",
  },
  {
    tag: 'api-users-get-operations-by-id',
    description: "Get user's operation.",
  },
  {
    tag: 'api-users-get-operations-receipt-by-id',
    description: 'Get receipt by its operation id',
  },
  {
    tag: 'api-users-get-operations-wallet-invitations-user',
    description: "List user's sent wallet invitations",
  },
  {
    tag: 'api-users-post-operations-wallet-invitations',
    description: 'Create new wallet invitation',
  },
  {
    tag: 'api-users-get-operations-wallet-invitations-my',
    description: "List user's received wallet invitations",
  },
  {
    tag: 'api-users-put-operations-wallet-invitations-accept',
    description: 'Accept a wallet invitation',
  },
  {
    tag: 'api-users-put-operations-wallet-invitations-decline',
    description: 'Decline a wallet invitation',
  },
  {
    tag: 'api-users-delete-operations-wallet-invitations-by-id',
    description: 'Cancel a wallet invitation',
  },
  {
    tag: 'api-users-get-quotations-trends',
    description: 'Get quotation trends',
  },
  {
    tag: 'api-users-get-quotations-spot',
    description: 'Get new SPOT quotation',
  },
  {
    tag: 'api-users-post-conversions',
    description: 'Create a conversion',
  },
  {
    tag: 'api-users-get-conversions',
    description: 'List conversions',
  },
  {
    tag: 'api-users-get-payments-gateway-deposits-by-id',
    description: 'Get deposit by ID',
  },
  {
    tag: 'api-users-get-payments-gateway-deposits',
    description: 'List deposits',
  },
  {
    tag: 'api-users-get-payments-gateway-company',
    description: 'Get company information',
  },
  {
    tag: 'api-users-get-payments-gateway-devolutions',
    description: 'List devolutions',
  },
  {
    tag: 'api-users-get-payments-gateway-devolutions-by-id',
    description: 'Get devolution by ID',
  },
  {
    tag: 'api-users-get-payments-gateway-orders-by-id',
    description: 'Get order by ID',
  },
  {
    tag: 'api-users-get-payments-gateway-orders',
    description: 'List orders',
  },
  {
    tag: 'api-users-get-payments-gateway-withdrawals-by-id',
    description: 'Get withdrawal by ID',
  },
  {
    tag: 'api-users-get-payments-gateway-withdrawals',
    description: 'List withdrawals',
  },
  {
    tag: 'api-users-get-payments-gateway-refunds-by-id',
    description: 'Get refund by ID',
  },
  {
    tag: 'api-users-get-payments-gateway-refunds',
    description: 'List refunds',
  },
  {
    tag: 'api-users-post-payments-gateway-check-wallets',
    description: 'Check wallets',
  },
  {
    tag: 'api-users-get-users-has-pin',
    description: 'Get user has pin',
  },
  {
    tag: 'api-users-patch-users-pin',
    description: 'Update existing pin for user',
  },
  {
    tag: 'api-users-put-users-pin',
    description: 'Create new pin for user',
  },
  {
    tag: 'api-users-get-pix-payments',
    description: "List user's payments",
  },
];

const apiPaasActions = [
  {
    tag: 'api-paas-post-banking-ted',
    description: 'Create new TED operation',
  },
  {
    tag: 'api-paas-get-banking-ted-banks',
    description: 'List banks that support TED operations',
  },
  {
    tag: 'api-paas-get-banking-ted',
    description: "List user's TED operations",
  },
  {
    tag: 'api-paas-get-banking-ted-by-id',
    description: 'Get TED operation by ID',
  },
  {
    tag: 'api-paas-post-withdraw-setting-request',
    description: 'Create user withdraw settings',
  },
  {
    tag: 'api-paas-get-withdraw-setting-request-by-id',
    description: 'Get user withdraw settings',
  },
  {
    tag: 'api-paas-get-operations-currencies',
    description: 'Get a list of currencies',
  },
  {
    tag: 'api-paas-get-operations',
    description: "List user's operations",
  },
  {
    tag: 'api-paas-get-operations-by-id',
    description: "Get user's operation.",
  },
  {
    tag: 'api-paas-get-operations-receipt-by-id',
    description: 'Get receipt by its operation id',
  },
  {
    tag: 'api-paas-post-operations-p2p-transfers',
    description: 'Create a P2P transfer',
  },
  {
    tag: 'api-paas-post-operations-wallets',
    description: 'Create a new wallet',
  },
  {
    tag: 'api-paas-delete-operations-wallets-by-id',
    description: 'Delete a wallet by id',
  },
  {
    tag: 'api-paas-get-operations-wallets',
    description: "List user's wallets",
  },
  {
    tag: 'api-paas-get-operations-wallets-by-id',
    description: "Get a user's wallet by id",
  },
  {
    tag: 'api-paas-put-operations-wallets-by-id',
    description: 'Update a wallet data',
  },
  {
    tag: 'api-paas-get-operations-wallet-accounts',
    description: "List user's wallet accounts",
  },
  {
    tag: 'api-paas-get-operations-wallet-accounts-by-id',
    description: "Get user's wallet account by id",
  },
  {
    tag: 'api-paas-post-otc-conversions',
    description: 'Create new currency conversion',
  },
  {
    tag: 'api-paas-get-otc-conversions',
    description: "List user's conversions",
  },
  {
    tag: 'api-paas-get-otc-conversions-by-id',
    description: 'Get conversion by ID',
  },
  {
    tag: 'api-paas-get-otc-conversions-credit-balance',
    description: "Get user's credit balance and liability",
  },
  {
    tag: 'api-paas-get-otc-conversions-quotations-by-id',
    description: 'Get quotation by Conversion ID',
  },
  {
    tag: 'api-paas-get-pix-keys-decode-by-key',
    description: 'Decodes pix key',
  },
  {
    tag: 'api-paas-post-pix-keys',
    description: 'Create new random key',
  },
  {
    tag: 'api-paas-delete-pix-keys-by-id',
    description: "Delete user's key by id",
  },
  {
    tag: 'api-paas-post-pix-keys-dismiss-by-id',
    description: 'Dismiss pix key by ID',
  },
  {
    tag: 'api-paas-get-pix-keys',
    description: "List the user's keys",
  },
  {
    tag: 'api-paas-get-pix-keys-by-id',
    description: "Get a user's key by id",
  },
  {
    tag: 'api-paas-get-pix-payments-receipt-by-operation-id',
    description: 'Get receipt by its operation id',
  },
  {
    tag: 'api-paas-get-pix-payments-by-id',
    description: 'Get a PIX payment status',
  },
  {
    tag: 'api-paas-post-pix-payments-by-account-instant-billing',
    description: 'Create a payment with account',
  },
  {
    tag: 'api-paas-post-pix-payments-decode-by-account',
    description: 'Create new Decoded Pix Account ID',
  },
  {
    tag: 'api-paas-post-pix-payments-by-key-instant-billing',
    description: 'Create a payment with pix key',
  },
  {
    tag: 'api-paas-get-pix-deposits',
    description: "List user's pix deposits",
  },
  {
    tag: 'api-paas-get-pix-deposits-by-id',
    description: 'Get pix deposit by ID',
  },
  {
    tag: 'api-paas-post-pix-deposits-qr-codes-dynamic-instant-billing',
    description: 'Create new dynamic QR Code',
  },
  {
    tag: 'api-paas-get-pix-payments',
    description: "List user's payments",
  },
  {
    tag: 'api-paas-get-pix-deposits-qr-codes-dynamic-by-id',
    description: 'Get dynamic QR code by ID',
  },
  {
    tag: 'api-paas-get-pix-devolutions-by-id',
    description: 'Get pix devolution by ID',
  },
  {
    tag: 'api-paas-post-pix-devolutions',
    description: 'Create new pix devolution',
  },
  {
    tag: 'api-paas-get-pix-devolutions',
    description: "List user's pix devolutions",
  },
  {
    tag: 'api-paas-get-pix-devolutions-received',
    description: "List user's received pix devolutions",
  },
  {
    tag: 'api-paas-get-pix-devolutions-received-by-id',
    description: 'Get received pix devolution by ID',
  },
  {
    tag: 'api-paas-get-quotations-spot',
    description: 'Get new SPOT quotation',
  },
];

const fullActions = [...apiUsersActions, ...apiPaasActions];

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const Op = Sequelize.Op;

    try {
      // Delete old action names to reinsert new names.
      await queryInterface.bulkDelete(
        'permission_actions',
        { tag: { [Op.in]: oldActions } },
        { transaction },
      );

      const action_ids = await queryInterface.sequelize.query(
        'SELECT id FROM "permission_actions" WHERE tag IN (:tag)',
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { tag: fullActions.map(({ tag }) => tag) },
        },
      );

      if (action_ids.length) return;

      await queryInterface.bulkInsert(
        'permission_actions',
        fullActions.map((item) => ({
          ...item,
          id: uuidV4(),
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
        'permission_actions',
        { tag: { [Op.in]: fullActions.map(({ tag }) => tag) } },
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
