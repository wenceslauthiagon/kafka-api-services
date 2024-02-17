'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('remittance_exposure_rules', {
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
          unique: true,
        },
        currencySymbol: {
          field: 'currency_symbol',
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        amount: {
          field: 'amount',
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        seconds: {
          field: 'seconds',
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        settlementDateRules: {
          field: 'settlement_date_rules',
          type: Sequelize.ARRAY(Sequelize.JSONB),
          allowNull: true,
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
      await queryInterface.dropTable('remittance_exposure_rules', {
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
