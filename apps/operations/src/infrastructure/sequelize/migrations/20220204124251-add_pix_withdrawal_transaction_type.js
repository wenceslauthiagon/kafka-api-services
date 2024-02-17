module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Transaction_types', [
      {
        title: 'Withdrawal PIX Payment',
        tag: 'PIXWITHDRAWAL',
        participants: 'OWNER',
      },
    ]);

    await queryInterface.bulkInsert('Transaction_types', [
      {
        title: 'Person to person withdrawal PIX Payment',
        tag: 'PIXP2PWITHDRAWAL',
        participants: 'BOTH',
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Transaction_types', {
      tag: 'PIXWITHDRAWAL',
    });
    await queryInterface.bulkDelete('Transaction_types', {
      tag: 'PIXP2PWITHDRAWAL',
    });
  },
};
