const { v4: uuidV4 } = require('uuid');

const actions = [
  {
    tag: 'post-auth-change-password',
    description: 'Change user password',
  },
  {
    tag: 'delete-auth-forgot-password-by-id',
    description: 'Decline forgot password',
  },
  {
    tag: 'post-auth-verify-pin',
    description: 'Verify pin user',
  },
  {
    tag: 'post-limit-request',
    description: 'Create user limit',
  },
  {
    tag: 'post-withdraw-setting-request',
    description: 'Create user withdraw settings',
  },
  {
    tag: 'get-withdraw-setting-request-by-id',
    description: 'Get user withdraw settings',
  },
  {
    tag: 'post-pix-keys-by-id-claims-start',
    description: 'Approve ownership claim start process',
  },
  {
    tag: 'post-pix-keys-by-id-portabilities-approve',
    description: 'Approve portability process',
  },
  {
    tag: 'post-pix-keys-by-id-portabilities-start',
    description: 'Approve portability start process',
  },
  {
    tag: 'delete-pix-keys-by-id-code',
    description: 'Cancel pix key',
  },
  {
    tag: 'delete-pix-keys-by-id-portabilities-approve',
    description: 'Cancel portability process',
  },
  {
    tag: 'delete-pix-keys-by-id-claim-start',
    description: 'Cancel ownership claim start process',
  },
  {
    tag: 'delete-pix-keys-by-id-portabilities-start',
    description: 'Cancel portability start process',
  },
  {
    tag: 'get-pix-keys-decode',
    description: 'Decodes pix key',
  },
  {
    tag: 'post-pix-keys',
    description: 'Create new random key',
  },
  {
    tag: 'delete-pix-keys-by-id',
    description: "Delete user's key by id",
  },
  {
    tag: 'post-pix-keys-dismiss-by-id',
    description: 'Dismiss pix key by ID',
  },
  {
    tag: 'get-pix-keys',
    description: "List the user's keys",
  },
  {
    tag: 'get-pix-keys-by-id',
    description: "Get a user's key by id",
  },
  {
    tag: 'get-pix-keys-by-id-code',
    description: 'Send confirmation code',
  },
  {
    tag: 'post-pix-keys-verify-code-by-id',
    description: 'Confirm pending key code',
  },
  {
    tag: 'get-pix-payments-receipt-by-operation-id',
    description: 'Get receipt by its operation id',
  },
  {
    tag: 'delete-pix-payments-by-operation-id',
    description: 'Cancel payment by operation id',
  },
  {
    tag: 'get-pix-payments-decode',
    description: 'Decodes QR code by its emv code',
  },
  {
    tag: 'get-pix-payments-by-id',
    description: 'Get a PIX payment status',
  },
  {
    tag: 'post-pix-payments-by-account-instant-billing',
    description: 'Create a payment with account',
  },
  {
    tag: 'post-pix-payments-by-qr-code-static-instant-billing',
    description: 'Create a payment with qr code static',
  },
  {
    tag: 'post-pix-payments-by-qr-code-static-withdrawal',
    description: 'Withdrawal a payment with qr code static',
  },
  {
    tag: 'post-pix-payments-by-qr-code-dynamic-instant-billing',
    description: 'Create a payment with qr code dynamic',
  },
  {
    tag: 'post-pix-payments-by-qr-code-dynamic-withdrawal',
    description: 'Withdrawal a payment with qr code dynamic',
  },
  {
    tag: 'post-pix-payments-by-qr-code-dynamic-due-date-billing',
    description: 'Duedate a payment with qr code dynamic',
  },
  {
    tag: 'post-pix-payments-by-qr-code-dynamic-change',
    description: 'Change a payment with qr code dynamic',
  },
  {
    tag: 'post-pix-payments-decode-by-account',
    description: 'Create new Decoded Pix Account ID',
  },
  {
    tag: 'post-pix-payment-decode-by-account',
    description: 'Create new decoded Pix account ID',
  },
  {
    tag: 'get-pix-payment-decode-by-key',
    description: 'Create new Decoded Pix Key ID',
  },
  {
    tag: 'post-pix-payments-by-key-instant-billing',
    description: 'Create a payment with pix key',
  },
  {
    tag: 'get-pix-deposits',
    description: "List user's pix deposits",
  },
  {
    tag: 'get-pix-deposits-by-id',
    description: 'Get pix deposit by ID',
  },
  {
    tag: 'get-pix-deposits-qr-codes',
    description: "List user's QR codes",
  },
  {
    tag: 'post-pix-deposits-qr-codes',
    description: 'Create a static QR Code',
  },
  {
    tag: 'get-pix-deposits-qr-codes-by-id',
    description: "Get a user's QR code by id",
  },
  {
    tag: 'delete-pix-deposits-qr-codes-by-id',
    description: "Delete user's QR code",
  },
  {
    tag: 'post-pix-deposits-qr-codes-dynamic-instant-billing',
    description: 'Create new dynamic QR Code',
  },
  {
    tag: 'post-pix-deposits-qr-codes-dynamic-due-date',
    description: 'Create a due date dynamic QR Code',
  },
  {
    tag: 'post-pix-deposits-qr-codes-dynamic-withdrawal',
    description: 'Create a withdrawal dynamic QR Code',
  },
  {
    tag: 'post-pix-deposits-qr-codes-dynamic-change',
    description: 'Create a change dynamic QR Code',
  },
  {
    tag: 'get-pix-deposits-qr-codes-dynamic-by-id',
    description: 'Get dynamic QR code by ID',
  },
  {
    tag: 'get-pix-devolutions-by-id',
    description: 'Get pix devolution by ID',
  },
  {
    tag: 'post-pix-devolutions',
    description: 'Create new pix devolution',
  },
  {
    tag: 'get-pix-devolutions',
    description: "List user's pix devolutions",
  },
  {
    tag: 'get-pix-devolutions-received',
    description: "List user's received pix devolutions",
  },
  {
    tag: 'get-pix-devolutions-received-by-id',
    description: 'Get received pix devolution by ID',
  },
  {
    tag: 'post-pix-warning-pix-devolution',
    description: 'Create new warning pix devolution',
  },
  {
    tag: 'get-pix-statements',
    description: "List user's transaction's statements",
  },
  {
    tag: 'get-banking-banks',
    description: 'List the banks',
  },
  {
    tag: 'get-banking-ted-banks',
    description: 'List banks that support TED operations',
  },
  {
    tag: 'get-banking-ted',
    description: "List user's TED operations",
  },
  {
    tag: 'post-banking-ted',
    description: 'Create new TED operation',
  },
  {
    tag: 'get-banking-ted-by-id',
    description: 'Get TED operation by ID',
  },
  {
    tag: 'post-operations-p2p-transfers',
    description: 'Create a P2P transfer',
  },
  {
    tag: 'patch-limit-users',
    description: 'Update user limit',
  },
  {
    tag: 'get-limit-users',
    description: 'Get user limits by filter',
  },
  {
    tag: 'get-limit-types',
    description: 'Get limit types by filter',
  },
  {
    tag: 'post-operations-wallets',
    description: 'Create a new wallet',
  },
  {
    tag: 'get-operations-wallets',
    description: "List user's wallets",
  },
  {
    tag: 'put-operations-wallets-by-id',
    description: 'Update a wallet data',
  },
  {
    tag: 'delete-operations-wallets-by-id',
    description: 'Delete a wallet by id',
  },
  {
    tag: 'get-operations-wallets-by-id',
    description: "Get a user's wallet by id",
  },
  {
    tag: 'delete-operations-permissions-by-wallet-id',
    description: 'Delete a permission that the logged in user can access',
  },
  {
    tag: 'get-operations-permissions-by-wallet-id',
    description: "Get a user's wallet permissions",
  },
  {
    tag: 'delete-operations-permissions-by-wallet-id-and-user-id',
    description: 'Delete a permission from the user who owns a wallet',
  },
  {
    tag: 'patch-operations-permissions-by-wallet-id-and-user-id',
    description: "Update user's wallet permissions",
  },
  {
    tag: 'get-operations-wallet-accounts',
    description: "List user's wallet accounts",
  },
  {
    tag: 'get-operations-wallet-accounts-by-id',
    description: "Get user's wallet account by id",
  },
  {
    tag: 'get-operations-currencies',
    description: 'Get a list of currencies',
  },
  {
    tag: 'get-operations',
    description: "List user's operations",
  },
  {
    tag: 'get-operations-by-id',
    description: "Get user's operation.",
  },
  {
    tag: 'get-operations-receipt-by-id',
    description: 'Get receipt by its operation id',
  },
  {
    tag: 'get-operations-wallet-invitations-user',
    description: "List user's sent wallet invitations",
  },
  {
    tag: 'post-operations-wallet-invitations',
    description: 'Create new wallet invitation',
  },
  {
    tag: 'get-operations-wallet-invitations-my',
    description: "List user's received wallet invitations",
  },
  {
    tag: 'put-operations-wallet-invitations-accept',
    description: 'Accept a wallet invitation',
  },
  {
    tag: 'put-operations-wallet-invitations-decline',
    description: 'Decline a wallet invitation',
  },
  {
    tag: 'delete-operations-wallet-invitations-by-id',
    description: 'Cancel a wallet invitation',
  },
  {
    tag: 'get-quotations-trends',
    description: 'Get quotation trends',
  },
  {
    tag: 'get-quotations-spot',
    description: 'Get new SPOT quotation',
  },
  {
    tag: 'post-conversions',
    description: 'Create a conversion',
  },
  {
    tag: 'get-conversions',
    description: 'List conversions',
  },
  {
    tag: 'get-payments-gateway-deposits-by-id',
    description: 'Get deposit by ID',
  },
  {
    tag: 'get-payments-gateway-deposits',
    description: 'List deposits',
  },
  {
    tag: 'get-payments-gateway-company',
    description: 'Get company information',
  },
  {
    tag: 'get-payments-gateway-devolutions',
    description: 'List devolutions',
  },
  {
    tag: 'get-payments-gateway-devolutions-by-id',
    description: 'Get devolution by ID',
  },
  {
    tag: 'get-payments-gateway-orders-by-id',
    description: 'Get order by ID',
  },
  {
    tag: 'get-payments-gateway-orders',
    description: 'List orders',
  },
  {
    tag: 'get-payments-gateway-withdrawals-by-id',
    description: 'Get withdrawal by ID',
  },
  {
    tag: 'get-payments-gateway-withdrawals',
    description: 'List withdrawals',
  },
  {
    tag: 'get-payments-gateway-refunds-by-id',
    description: 'Get refund by ID',
  },
  {
    tag: 'get-payments-gateway-refunds',
    description: 'List refunds',
  },
  {
    tag: 'post-payments-gateway-check-wallets',
    description: 'Check wallets',
  },
  {
    tag: 'get-users-has-pin',
    description: 'Get user has pin',
  },
  {
    tag: 'patch-users-pin',
    description: 'Update existing pin for user',
  },
  {
    tag: 'put-users-pin',
    description: 'Create new pin for user',
  },
  {
    tag: 'get-pix-payments',
    description: "List user's payments",
  },
  {
    tag: 'post-otc-conversions',
    description: 'Create new currency conversion',
  },
  {
    tag: 'get-otc-conversions',
    description: "List user's conversions",
  },
  {
    tag: 'get-otc-conversions-credit-balance',
    description: "Get user's credit balance and liability",
  },
  {
    tag: 'get-otc-conversions-quotations-by-id',
    description: 'Get quotation by Conversion ID',
  },
  {
    tag: 'get-otc-conversions-by-id',
    description: 'Get conversion by ID',
  },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const action_ids = await queryInterface.sequelize.query(
        'SELECT id FROM "permission_actions" WHERE tag IN (:tag)',
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { tag: actions.map(({ tag }) => tag) },
        },
      );

      if (action_ids.length) return;

      await queryInterface.bulkInsert(
        'permission_actions',
        actions.map((item) => ({
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
        { tag: { [Op.in]: actions.map(({ tag }) => tag) } },
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
