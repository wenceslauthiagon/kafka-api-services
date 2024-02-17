'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add period start column
      await queryInterface.addColumn(
        'Limit_types',
        'period_start',
        {
          field: 'period_start',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'Limit_types',
        { period_start: 'INTERVAL' },
        { tag: 'CONVERSION' },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'Limit_types',
        { period_start: 'DATE' },
        {
          tag: [
            'BBP',
            'BTCSEND',
            'BRLP2P',
            'BTCP2P',
            'DEBITCARD',
            'WITHDRAW',
            'TEDSELF',
            'TED',
            'BANKSLIPS',
          ],
        },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'Limit_types',
        { period_start: 'DATE' },
        { period_start: null },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Limit_types',
        'period_start',
        {
          field: 'period_start',
          type: Sequelize.ENUM('INTERVAL', 'DATE'),
          allowNull: false,
        },
        { transaction },
      );

      // Add check column
      await queryInterface.addColumn(
        'Limit_types',
        'check',
        {
          field: 'check',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'Limit_types',
        { check: 'BOTH' },
        { tag: 'CONVERSION' },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'Limit_types',
        { check: 'OWNER' },
        {
          tag: [
            'BBP',
            'BTCSEND',
            'BRLP2P',
            'BTCP2P',
            'DEBITCARD',
            'WITHDRAW',
            'TEDSELF',
            'TED',
            'BANKSLIPS',
          ],
        },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'Limit_types',
        { check: 'OWNER' },
        { check: null },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Limit_types',
        'check',
        {
          field: 'check',
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
      await queryInterface.removeColumn('Limit_types', 'period_start', {
        transaction,
      });
      await queryInterface.removeColumn('Limit_types', 'check', {
        transaction,
      });
      await queryInterface.dropEnum('enum_Limit_types_period_start', {
        transaction,
      });
      await queryInterface.dropEnum('enum_Limit_types_check', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
