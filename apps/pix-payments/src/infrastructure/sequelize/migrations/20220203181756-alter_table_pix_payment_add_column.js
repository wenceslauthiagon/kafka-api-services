'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      //Add Columns

      // Decoded qr code
      await queryInterface.addColumn(
        'pix_payments',
        'decoded_qr_code_id',
        {
          field: 'decoded_qr_code_id',
          type: Sequelize.UUID,
        },
        { transaction },
      );

      // Payment Type
      await queryInterface.addColumn(
        'pix_payments',
        'payment_type',
        {
          field: 'payment_type',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'pix_payments',
        { payment_type: 'ACCOUNT' },
        { payment_type: null },
        { transaction },
      );

      await queryInterface.changeColumn(
        'pix_payments',
        'payment_type',
        {
          field: 'payment_type',
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      // Transaction TAG
      await queryInterface.addColumn(
        'pix_payments',
        'transaction_tag',
        {
          field: 'transaction_tag',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'pix_payments',
        { transaction_tag: 'PIXP2P' },
        { beneficiary_bank_code: '082' },
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'pix_payments',
        { transaction_tag: 'PIXSEND' },
        { transaction_tag: null },
        { transaction },
      );

      await queryInterface.changeColumn(
        'pix_payments',
        'transaction_tag',
        {
          field: 'transaction_tag',
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      //Alter type value to bigint
      await queryInterface.changeColumn(
        'pix_payments',
        'value',
        {
          field: 'value',
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        { transaction },
      );

      // Transaction ID
      await queryInterface.addColumn(
        'pix_payments',
        'transaction_id',
        {
          field: 'transaction_id',
          type: Sequelize.STRING,
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

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('pix_payments', 'decoded_qr_code_id', {
        transaction,
      });
      await queryInterface.removeColumn('pix_payments', 'payment_type', {
        transaction,
      });
      await queryInterface.removeColumn('pix_payments', 'transaction_tag', {
        transaction,
      });
      await queryInterface.changeColumn(
        'pix_payments',
        'value',
        {
          field: 'value',
          type: Sequelize.FLOAT,
        },
        { transaction },
      );
      await queryInterface.removeColumn('pix_payments', 'transaction_id', {
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
