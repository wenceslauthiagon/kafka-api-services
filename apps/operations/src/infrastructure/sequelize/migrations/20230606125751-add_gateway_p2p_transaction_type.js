module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Transaction_types', [
      {
        title: 'Gateway Debit',
        tag: 'GWDEB',
        participants: 'OWNER',
      },
      {
        title: 'Gateway Credit',
        tag: 'GWCRED',
        participants: 'BENEFICIARY',
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    const Op = Sequelize.Op;

    await queryInterface.bulkDelete('Transaction_types', {
      tag: 'GATEWAYP2P',
      tag: { [Op.in]: ['GWDEB', 'GWCRED'] },
    });
  },
};
