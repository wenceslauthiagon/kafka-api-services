'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'exchange_contracts',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          contractNumber: {
            field: 'contract_number',
            type: Sequelize.STRING,
            allowNull: true,
          },
          vetQuote: {
            field: 'vet_quote',
            type: Sequelize.DECIMAL(16, 4),
            allowNull: true,
          },
          contractQuote: {
            field: 'contract_quote',
            type: Sequelize.DECIMAL(16, 4),
            allowNull: false,
          },
          totalAmount: {
            field: 'total_amount',
            type: Sequelize.DECIMAL(16, 4),
            allowNull: false,
          },
          createdAt: {
            field: 'created_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          updatedAt: {
            field: 'updated_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('exchange_contracts', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();

      console.error(error);

      throw error;
    }
  },
};
