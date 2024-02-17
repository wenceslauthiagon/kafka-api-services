module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Transaction_types', [
      {
        title: 'Person to person PIX Devolution Payment',
        tag: 'PIXDEVP2P',
        participants: 'BOTH',
      },
      {
        title: 'PIX Devolution Payment',
        tag: 'PIXDEVSEND',
        participants: 'OWNER',
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    const Op = Sequelize.Op;
    await queryInterface.bulkDelete('Transaction_types', {
      tag: { [Op.in]: ['PIXDEVP2P', 'PIXDEVSEND'] },
    });
  },
};
