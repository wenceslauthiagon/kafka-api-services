module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Transaction_types', [
      {
        title: 'Change PIX Payment',
        tag: 'PIXCHANGE',
        participants: 'OWNER',
      },
    ]);

    await queryInterface.bulkInsert('Transaction_types', [
      {
        title: 'Person to person change PIX Payment',
        tag: 'PIXP2PCHANGE',
        participants: 'BOTH',
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Transaction_types', {
      tag: 'PIXCHANGE',
    });
    await queryInterface.bulkDelete('Transaction_types', {
      tag: 'PIXP2PCHANGE',
    });
  },
};
