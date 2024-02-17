'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_payments',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          operationId: {
            field: 'operation_id',
            type: Sequelize.STRING,
          },
          state: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          accountType: {
            field: 'account_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          personType: {
            field: 'person_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          branch: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          accountNumber: {
            field: 'account_number',
            type: Sequelize.STRING,
            allowNull: false,
          },
          bankName: {
            field: 'bank_name',
            type: Sequelize.STRING,
          },
          bankCode: {
            field: 'bank_code',
            type: Sequelize.STRING,
            allowNull: false,
          },
          document: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING,
          },
          value: {
            type: Sequelize.FLOAT,
            allowNull: false,
          },
          endToEndId: {
            field: 'end_to_end_id',
            type: Sequelize.STRING,
          },
          paymentDate: {
            field: 'payment_date',
            type: Sequelize.DATE,
          },
          description: {
            field: 'description',
            type: Sequelize.STRING,
          },
          userId: {
            field: 'user_id',
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
          deletedAt: {
            field: 'deleted_at',
            type: Sequelize.DATE,
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
      await queryInterface.dropTable('pix_payments', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
