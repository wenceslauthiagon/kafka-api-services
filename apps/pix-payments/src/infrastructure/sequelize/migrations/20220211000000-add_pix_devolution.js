'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_devolutions',
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
          depositId: {
            field: 'deposit_id',
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'pix_deposits',
              key: 'id',
            },
          },
          operationId: {
            field: 'operation_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          transactionId: {
            field: 'transaction_id',
            type: Sequelize.STRING,
          },
          state: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          amount: {
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          devolutionCode: {
            field: 'devolution_code',
            type: Sequelize.STRING,
          },
          description: {
            field: 'description',
            type: Sequelize.STRING,
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

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('pix_devolutions', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
