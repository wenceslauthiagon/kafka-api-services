'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('cashbacks', {
        id: {
          field: 'id',
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        userId: {
          field: 'user_id',
          type: Sequelize.UUID,
          allowNull: false,
        },
        conversionId: {
          field: 'conversion_id',
          type: Sequelize.UUID,
          allowNull: false,
        },
        amount: {
          field: 'amount',
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        currencyId: {
          field: 'currency_id',
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        description: {
          field: 'description',
          type: Sequelize.STRING,
        },
        issuedBy: {
          field: 'issued_by',
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
      });

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
      await queryInterface.dropTable('cashbacks', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
