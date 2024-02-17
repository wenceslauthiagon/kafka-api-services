const channel = {
  APP: 'Aplicativo',
  TELEGRAM: 'Telegram',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  AUTOMED_TELLER_MACHINE: 'Caixa Eletrônico',
  BACEN_ACCREDITED_STORE: 'Loja Credenciada BACEN',
};

const environment = {
  INTERNET: 'Internet',
  VIRTUAL: 'Virtual',
  PHYSICAL: 'Físico',
  PHYSICAL_AND_VIRTUAL: 'Físico e Virtual',
  PHYSICAL_AND_ATM: 'Físico e Banco 24h',
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

const internetEnvironmentTransactionTags = ['P2PTP', 'P2PTC'];
const virtualEnvironmentTransactionTags = [
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
const physicalEnvironmentTransactionTags = ['PIXWITHDRAWAL', 'PIXCHANGE'];
const physicalAndVirtualEnvironmentTransactionTags = [
  'PIXDEVSEND',
  'DEBITTRANSACTION',
];
const physicalAndAtmEnvironmentTransactionTags = ['WITHDRAW'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Transaction_types',
        'environment',
        { type: Sequelize.STRING, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'Transaction_types',
        'channel',
        { type: Sequelize.STRING, allowNull: true },
        { transaction },
      );

      //  fill channel column
      if (appChannelTransactionTags.length) {
        await queryInterface.bulkUpdate(
          'Transaction_types',
          { channel: channel.APP },
          { tag: appChannelTransactionTags },
          { transaction },
        );
      }

      if (telegramChannelTransactionTags.length) {
        await queryInterface.bulkUpdate(
          'Transaction_types',
          { channel: channel.TELEGRAM },
          { tag: telegramChannelTransactionTags },
          { transaction },
        );
      }

      if (debitCardChannelTransactionTags.length) {
        await queryInterface.bulkUpdate(
          'Transaction_types',
          { channel: channel.DEBIT_CARD },
          { tag: debitCardChannelTransactionTags },
          { transaction },
        );
      }

      if (automedTellerMachineChannelTransactionTags.length) {
        await queryInterface.bulkUpdate(
          'Transaction_types',
          { channel: channel.AUTOMED_TELLER_MACHINE },
          { tag: automedTellerMachineChannelTransactionTags },
          { transaction },
        );
      }

      if (bacenAccreditedStoreChannelTransactionTags.length) {
        await queryInterface.bulkUpdate(
          'Transaction_types',
          { channel: channel.BACEN_ACCREDITED_STORE },
          { tag: bacenAccreditedStoreChannelTransactionTags },
          { transaction },
        );
      }

      //  fill environment column
      if (internetEnvironmentTransactionTags.length) {
        await queryInterface.bulkUpdate(
          'Transaction_types',
          { environment: environment.INTERNET },
          { tag: internetEnvironmentTransactionTags },
          { transaction },
        );
      }

      if (virtualEnvironmentTransactionTags.length) {
        await queryInterface.bulkUpdate(
          'Transaction_types',
          { environment: environment.VIRTUAL },
          { tag: virtualEnvironmentTransactionTags },
          { transaction },
        );
      }

      if (physicalEnvironmentTransactionTags.length) {
        await queryInterface.bulkUpdate(
          'Transaction_types',
          { environment: environment.PHYSICAL },
          { tag: physicalEnvironmentTransactionTags },
          { transaction },
        );
      }

      if (physicalAndVirtualEnvironmentTransactionTags.length) {
        await queryInterface.bulkUpdate(
          'Transaction_types',
          { environment: environment.PHYSICAL_AND_VIRTUAL },
          { tag: physicalAndVirtualEnvironmentTransactionTags },
          { transaction },
        );
      }

      if (physicalAndAtmEnvironmentTransactionTags.length) {
        await queryInterface.bulkUpdate(
          'Transaction_types',
          { environment: environment.PHYSICAL_AND_ATM },
          { tag: physicalAndAtmEnvironmentTransactionTags },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Transaction_types', 'environment', {
        transaction,
      });
      await queryInterface.removeColumn('Transaction_types', 'channel', {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
