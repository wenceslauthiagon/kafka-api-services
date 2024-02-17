'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.renameTable(
        'conversion_orders',
        'cryto_remittances',
        {
          transaction,
        },
      );

      await queryInterface.addColumn(
        'crypto_orders',
        'quotation_id',
        {
          type: Sequelize.UUID,
        },
        {
          transaction,
        },
      );

      await queryInterface.addColumn(
        'crypto_orders',
        'crypto_remittance_id',
        {
          type: Sequelize.UUID,
        },
        {
          transaction,
        },
      );

      await queryInterface.addColumn(
        'crypto_orders',
        'remaining_crypto_remittance_id',
        {
          type: Sequelize.UUID,
        },
        {
          transaction,
        },
      );

      await queryInterface.addColumn(
        'crypto_orders',
        'client_name',
        {
          type: Sequelize.STRING,
        },
        {
          transaction,
        },
      );

      await queryInterface.addColumn(
        'crypto_orders',
        'client_document',
        {
          type: Sequelize.STRING,
        },
        {
          transaction,
        },
      );

      await queryInterface.addColumn(
        'crypto_orders',
        'client_document_type',
        {
          type: Sequelize.STRING,
        },
        {
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('crypto_orders', 'quotation_id', {
        transaction,
      });
      await queryInterface.removeColumn(
        'crypto_orders',
        'crypto_remittance_id',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn(
        'crypto_orders',
        'remaining_crypto_remittance_id',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn('crypto_orders', 'client_name', {
        transaction,
      });
      await queryInterface.removeColumn('crypto_orders', 'client_document', {
        transaction,
      });
      await queryInterface.removeColumn(
        'crypto_orders',
        'client_document_type',
        {
          transaction,
        },
      );
      await queryInterface.renameTable(
        'cryto_remittances',
        'conversion_orders',
        {
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
