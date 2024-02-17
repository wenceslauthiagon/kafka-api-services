'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Remittances', 'contract_number', {
        transaction,
      });

      await queryInterface.removeColumn('Remittances', 'bitblue_amount', {
        transaction,
      });

      await queryInterface.removeColumn('Remittances', 'type', {
        transaction,
      });

      await queryInterface.removeColumn('Remittances', 'vet_quote', {
        transaction,
      });

      await queryInterface.removeColumn('Remittances', 'contract_quote', {
        transaction,
      });

      await queryInterface.addColumn(
        'Remittances',
        'exchange_contract_id',
        {
          field: 'exchange_contract_id',
          type: Sequelize.UUID,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Remittances',
        'client_amount',
        {
          field: 'client_amount',
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Remittances',
        'bank_quote',
        {
          field: 'bank_quote',
          type: Sequelize.DECIMAL(16, 4),
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

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Remittances',
        'contract_number',
        { field: 'contract_number', type: Sequelize.STRING },
        { transaction },
      );

      await queryInterface.addColumn(
        'Remittances',
        'bitblue_amount',
        { field: 'bitblue_amount', type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.addColumn(
        'Remittances',
        'type',
        { field: 'type', type: Sequelize.STRING },
        { transaction },
      );

      await queryInterface.addColumn(
        'Remittances',
        'vet_quote',
        {
          field: 'vet_quote',
          type: Sequelize.DECIMAL(16, 4),
          default: 0,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Remittances',
        'contract_quote',
        {
          field: 'contract_quote',
          type: Sequelize.DECIMAL(16, 4),
          default: 0,
        },
        { transaction },
      );

      await queryInterface.removeColumn('Remittances', 'exchange_contract_id', {
        transaction,
      });

      await queryInterface.removeColumn('Remittances', 'client_amount', {
        transaction,
      });

      await queryInterface.removeColumn('Remittances', 'bank_quote', {
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
