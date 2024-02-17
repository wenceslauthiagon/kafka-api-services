'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Remittances"
        DROP CONSTRAINT IF EXISTS "Remittances_provider_id_fkey";
        `,
        { transaction },
      );

      await queryInterface.addColumn(
        'Remittances',
        'send_date',
        {
          field: 'send_date',
          type: Sequelize.DATE,
          allowNull: true,
        },
        {
          transaction,
        },
      );

      await queryInterface.addColumn(
        'Remittances',
        'receive_date',
        {
          field: 'receive_date',
          type: Sequelize.DATE,
          allowNull: true,
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
      await Promise.all([
        queryInterface.removeColumn('Remittances', 'send_date', {
          transaction,
        }),
        queryInterface.removeColumn('Remittances', 'receive_date', {
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
