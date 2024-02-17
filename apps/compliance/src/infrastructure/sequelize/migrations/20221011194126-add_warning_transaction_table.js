'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('warning_transactions', {
      id: {
        field: 'id',
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      operationId: {
        field: 'operation_id',
        type: Sequelize.UUID,
        allowNull: false,
      },
      transactionTag: {
        field: 'transaction_tag',
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        field: 'status',
        type: Sequelize.STRING,
        allowNull: false,
      },
      analysisResult: {
        field: 'analysis_result',
        type: Sequelize.STRING,
        defaultValue: null,
      },
      created_at: {
        field: 'created_at',
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        field: 'updated_at',
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },
  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('warning_transactions', {
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
