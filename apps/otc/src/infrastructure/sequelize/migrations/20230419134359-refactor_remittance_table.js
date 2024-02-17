'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.sequelize.query(
          `
          ALTER TABLE "Remittances"
          DROP CONSTRAINT IF EXISTS "Remittances_exchange_contract_id_fkey";
          `,
          { transaction },
        ),
        queryInterface.addColumn(
          'Remittances',
          'amount',
          {
            field: 'amount',
            type: Sequelize.BIGINT,
            allowNull: true,
          },
          { transaction },
        ),
        queryInterface.addColumn(
          'Remittances',
          'side',
          {
            field: 'side',
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction },
        ),
        queryInterface.addColumn(
          'Remittances',
          'type',
          {
            field: 'type',
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction },
        ),
        queryInterface.addColumn(
          'Remittances',
          'currency_id',
          {
            field: 'currency_id',
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          { transaction },
        ),
        queryInterface.addColumn(
          'Remittances',
          'system_id',
          {
            field: 'system_id',
            type: Sequelize.UUID,
            allowNull: true,
          },
          { transaction },
        ),
        queryInterface.addColumn(
          'Remittances',
          'is_concomitant',
          {
            field: 'is_concomitant',
            type: Sequelize.BOOLEAN,
            allowNull: true,
          },
          { transaction },
        ),
      ]);

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
      await Promise.all([
        queryInterface.removeColumn('Remittances', 'amount', {
          transaction,
        }),
        queryInterface.removeColumn('Remittances', 'side', {
          transaction,
        }),
        queryInterface.removeColumn('Remittances', 'type', {
          transaction,
        }),
        queryInterface.removeColumn('Remittances', 'currency_id', {
          transaction,
        }),
        queryInterface.removeColumn('Remittances', 'system_id', {
          transaction,
        }),
        queryInterface.removeColumn('Remittances', 'is_concomitant', {
          transaction,
        }),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
