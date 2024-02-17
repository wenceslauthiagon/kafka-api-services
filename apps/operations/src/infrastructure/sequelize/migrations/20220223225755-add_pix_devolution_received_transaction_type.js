module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Transaction_types', [
      {
        title: 'New PIX Devolution Received',
        tag: 'PIXDEVREC',
        participants: 'BENEFICIARY',
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Transaction_types', {
      tag: 'PIXDEVREC',
    });
  },
};
