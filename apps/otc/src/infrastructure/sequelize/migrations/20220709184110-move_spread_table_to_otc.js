module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      if (!(await queryInterface.tableExists('spreads', { transaction }))) {
        await queryInterface.createTable(
          'spreads',
          {
            id: {
              field: 'id',
              type: Sequelize.UUID,
              defaultValue: Sequelize.UUIDV4,
              primaryKey: true,
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
            buy: {
              field: 'buy',
              type: Sequelize.FLOAT,
              allowNull: false,
            },
            sell: {
              field: 'sell',
              type: Sequelize.FLOAT,
              allowNull: false,
            },
            amount: {
              field: 'amount',
              type: Sequelize.FLOAT,
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
            deletedAt: {
              field: 'deleted_at',
              type: Sequelize.DATE,
              allowNull: true,
            },
          },
          { transaction },
        );
      } else {
        await queryInterface.renameColumn(
          'spreads',
          'source_id',
          'currency_id',
          {
            transaction,
          },
        );

        await queryInterface.renameColumn(
          'spreads',
          'source_symbol',
          'currency_symbol',
          {
            transaction,
          },
        );

        await queryInterface.removeColumn('spreads', 'target_id', {
          transaction,
        });
        await queryInterface.removeColumn('spreads', 'target_symbol', {
          transaction,
        });
        await queryInterface.removeColumn('spreads', 'provider_id', {
          transaction,
        });
        await queryInterface.removeColumn('spreads', 'provider_tag', {
          transaction,
        });
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
      await queryInterface.dropTable('spreads', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
