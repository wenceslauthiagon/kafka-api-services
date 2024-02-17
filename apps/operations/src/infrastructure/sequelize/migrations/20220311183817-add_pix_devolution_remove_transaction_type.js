module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkDelete('Transaction_types', {
      tag: 'PIXDEVP2P',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.bulkInsert('Transaction_types', [
      {
        title: 'Person to person PIX Devolution Payment',
        tag: 'PIXDEVP2P',
        participants: 'BOTH',
      },
    ]);
  },
};
