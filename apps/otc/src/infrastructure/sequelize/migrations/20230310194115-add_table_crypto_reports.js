module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'crypto_reports',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.UUIDV4,
          },
          operationId: {
            field: 'operation_id',
            type: Sequelize.UUID,
            defaultValue: null,
          },
          type: {
            field: 'type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          cryptoAmount: {
            field: 'crypto_amount',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          cryptoPrice: {
            field: 'crypto_price',
            type: Sequelize.BIGINT,
            defaultValue: null,
          },
          accuratePrice: {
            field: 'accurate_price',
            type: Sequelize.BOOLEAN,
            defaultValue: null,
          },
          fiatAmount: {
            field: 'fiat_amount',
            type: Sequelize.BIGINT,
            defaultValue: null,
          },
          avgPrice: {
            field: 'avg_price',
            type: Sequelize.BIGINT,
            defaultValue: null,
          },
          cryptoBalance: {
            field: 'crypto_balance',
            type: Sequelize.BIGINT,
            defaultValue: null,
          },
          profit: {
            field: 'profit',
            type: Sequelize.BIGINT,
            defaultValue: null,
          },
          loss: {
            field: 'loss',
            type: Sequelize.BIGINT,
            defaultValue: null,
          },
          profitLossPercentage: {
            field: 'profit_loss_percentage',
            type: Sequelize.BIGINT,
            defaultValue: null,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          cryptoId: {
            field: 'crypto_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          conversionId: {
            field: 'conversion_id',
            type: Sequelize.UUID,
            defaultValue: null,
          },
          operationBtcReceiveId: {
            field: 'operation_btc_receive_id',
            type: Sequelize.UUID,
            defaultValue: null,
          },
          walletAccountId: {
            field: 'wallet_account_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          walletId: {
            field: 'wallet_id',
            type: Sequelize.UUID,
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
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('crypto_reports', { transaction });

      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },
};
