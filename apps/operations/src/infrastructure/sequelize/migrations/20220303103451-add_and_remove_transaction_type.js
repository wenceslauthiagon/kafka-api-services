module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXWITHDRAWAL',
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXP2PWITHDRAWAL',
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXSEND',
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXP2P',
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXCHANGE',
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXP2PCHANGE',
        },
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Instant billing PIX Payment account',
            tag: 'PIXSENDACC',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Instant billing PIX Payment key',
            tag: 'PIXSENDKEY',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Instant billing PIX Payment qr code static',
            tag: 'PIXSENDQRS',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Withdrawal PIX Payment qr code static',
            tag: 'PIXWITHDRAWALQRS',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Instant billing PIX Payment qr code dynamic',
            tag: 'PIXSENDQRD',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Withdrawal PIX Payment qr code dynamic',
            tag: 'PIXWITHDRAWALQRD',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Change PIX Payment qr code dynamic',
            tag: 'PIXCHANGEQRD',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'Transaction_types',
        [
          {
            title: 'Duedate PIX Payment qr code dynamic',
            tag: 'PIXDUEDATEQRD',
            participants: 'OWNER',
          },
        ],
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXSENDACC',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXSENDKEY',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXSENDQRS',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXWITHDRAWALQRS',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXSENDQRD',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXWITHDRAWALQRD',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXCHANGEQRD',
        },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'Transaction_types',
        {
          tag: 'PIXDUEDATEQRD',
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
