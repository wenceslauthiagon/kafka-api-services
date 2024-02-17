module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Transaction_types', [
      {
        title: 'New Received PIX Deposit',
        tag: 'PIXREC',
        participants: 'BENEFICIARY',
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Transaction_types', {
      tag: 'PIXREC',
    });
  },
};
