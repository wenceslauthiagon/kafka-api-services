'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'p2p_transfers',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          currencyId: {
            field: 'currency_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          currencySymbol: {
            field: 'currency_symbol',
            type: Sequelize.STRING,
            allowNull: false,
          },
          operationId: {
            field: 'operation_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          amount: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          fee: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          description: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          createdAt: {
            field: 'created_at',
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Date.now(),
          },
          updatedAt: {
            field: 'updated_at',
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Date.now(),
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
      await queryInterface.dropTable('p2p_transfers', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
