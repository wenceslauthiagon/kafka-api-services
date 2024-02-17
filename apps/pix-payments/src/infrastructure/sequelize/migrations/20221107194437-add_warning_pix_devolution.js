'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'warning_pix_devolutions',
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
          operationId: {
            field: 'operation_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          endToEndId: {
            field: 'end_to_end_id',
            type: Sequelize.STRING,
          },
          amount: {
            field: 'amount',
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
          chargebackReason: {
            field: 'chargeback_reason',
            type: Sequelize.STRING,
          },
          state: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          failed_code: {
            field: 'failed_code',
            type: Sequelize.STRING,
          },
          failed_message: {
            field: 'failed_message',
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
      await queryInterface.dropTable('warning_pix_devolutions', {
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
