module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Transaction_types', [
      {
        title: 'Person to person PIX Payment',
        tag: 'PIXP2P',
        participants: 'BOTH',
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Transaction_types', {
      tag: 'PIXP2P',
    });
  },
};
