const channel = {
  TELEGRAM: 'Telegram',
  BACEN_ACCREDITED_STORE: 'LojaBACEN',
  DEBIT_CARD: 'CartãoDébito',
  APP: 'Aplicativo',
  AUTOMED_TELLER_MACHINE: 'CaixaEletrônico',
};

const environment = {
  VIRTUAL: 'Virtual',
};

const appChannelTransactionTags = [
  'CBK',
  'BBP',
  'P2PBT',
  'TED',
  'DEPORECEIVE',
  'TEDRECEIVE',
  'DEBITCBK',
  'TEDFAILURE',
  'BBPCBK',
  'TEDRECCBK',
  'DEPRECCBK',
  'DOCRECEIVE',
  'WITHDRAWCBK',
  'DBTCARDCRED',
  'PIXREC',
  'PIXDEVREC',
  'PIXSEND',
];
const telegramChannelTransactionTags = ['P2PTP', 'P2PTC'];
const debitCardChannelTransactionTags = ['DEBITTRANSACTION', 'PIXDEVSEND'];
const automedTellerMachineChannelTransactionTags = ['WITHDRAW'];
const bacenAccreditedStoreChannelTransactionTags = [
  'PIXWITHDRAWAL',
  'PIXCHANGE',
];

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      //  fill channel column

      await queryInterface.bulkUpdate(
        'Transaction_types',
        { channel: channel.APP },
        { tag: appChannelTransactionTags },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'Transaction_types',
        { channel: channel.TELEGRAM },
        { tag: telegramChannelTransactionTags },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'Transaction_types',
        { channel: channel.DEBIT_CARD },
        { tag: debitCardChannelTransactionTags },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'Transaction_types',
        { channel: channel.AUTOMED_TELLER_MACHINE },
        { tag: automedTellerMachineChannelTransactionTags },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'Transaction_types',
        { channel: channel.BACEN_ACCREDITED_STORE },
        { tag: bacenAccreditedStoreChannelTransactionTags },
        { transaction },
      );

      // update environment and channel columns where tag is CONV
      await queryInterface.bulkUpdate(
        'Transaction_types',
        { environment: environment.VIRTUAL, channel: channel.APP },
        { tag: 'CONV' },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  down: async () => console.log('Nothing to do.'),
};
