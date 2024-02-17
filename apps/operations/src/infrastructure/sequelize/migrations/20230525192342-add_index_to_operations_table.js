module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex(
      'Wallet_account_transactions',
      ['wallet_account_id', 'operation_id', 'transaction_type'],
      {
        unique: true,
        name: 'Wallet_account_transactions_key',
      },
    );
  },
  down: async (queryInterface) => {
    await queryInterface.removeIndex(
      'Wallet_account_transactions',
      'Wallet_account_transactions_key',
    );
  },
};
