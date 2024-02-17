module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Transaction_types',
        'participants',
        {
          field: 'participants',
          type: Sequelize.STRING,
        },
        {
          transaction,
        },
      );

      const bothTypes = [
        'P2PTP',
        'P2PTC',
        'P2MTP',
        'P2PBTCTP',
        'P2PBTCTC',
        'P2PBT',
        'CONV',
      ];
      const ownerOnlyTypes = [
        'SP',
        'BTCSEND',
        'BBP',
        'TED',
        'DEBITTRANSACTION',
        'WITHDRAW',
        'TEDUNDO',
        'TEDRECCBK',
        'DEPRECCBK',
        'CASHBACKCBK',
        'FORFEITURE',
        'ACTCLOSURE',
        'PIXSEND',
      ];
      const beneficiaryOnlyTypes = [
        'CBK',
        'BTCRECEIVE',
        'DEPORECEIVE',
        'TEDRECEIVE',
        'DEBITCBK',
        'TEDFAILURE',
        'BBPCBK',
        'BILLETFAILURE',
        'DOCRECEIVE',
        'PIXRECEIVE',
        'WITHDRAWCBK',
        'CASHBACK',
        'DBTCARDCRED',
        'REFREWARD',
        'EXTRACREDIT',
        'SALECREDCARD',
        'SALEDEBTCARD',
      ];

      if (bothTypes[0].length) {
        await queryInterface.bulkUpdate(
          'Transaction_types',
          { participants: 'BOTH' },
          { tag: bothTypes },
          { transaction },
        );
      }

      if (ownerOnlyTypes[0].length) {
        await queryInterface.bulkUpdate(
          'Transaction_types',
          { participants: 'OWNER' },
          { tag: ownerOnlyTypes },
          { transaction },
        );
      }

      if (beneficiaryOnlyTypes[0].length) {
        await queryInterface.bulkUpdate(
          'Transaction_types',
          { participants: 'BENEFICIARY' },
          { tag: beneficiaryOnlyTypes },
          { transaction },
        );
      }

      // Not listed types should be OWNER
      await queryInterface.bulkUpdate(
        'Transaction_types',
        { participants: 'OWNER' },
        { participants: null },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Transaction_types',
        'participants',
        {
          field: 'participants',
          type: Sequelize.ENUM('OWNER', 'BENEFICIARY', 'BOTH'),
          allowNull: false,
        },
        { transaction },
      );
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
      await queryInterface.removeColumn('Transaction_types', 'participants', {
        transaction,
      });
      await queryInterface.dropEnum('enum_Transaction_types_participants', {
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
