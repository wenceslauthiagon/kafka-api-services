'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('exchange_quotations', {
        id: {
          field: 'id',
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        remittanceId: {
          field: 'remittance_id',
          type: Sequelize.UUID,
          allowNull: false,
        },
        quotationPspId: {
          field: 'quotation_psp_id',
          type: Sequelize.STRING,
          allowNull: false,
        },
        solicitationPspId: {
          field: 'solicitation_psp_id',
          type: Sequelize.UUID,
          allowNull: false,
        },
        fxRate: {
          field: 'fx_rate',
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        amount: {
          field: 'amount',
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        amountExternalCurrency: {
          field: 'amount_external_currency',
          type: Sequelize.BIGINT,
          allowNull: false,
        },
        state: {
          field: 'state',
          type: Sequelize.STRING,
          allowNull: false,
        },
        props: {
          field: 'props',
          type: Sequelize.JSONB,
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
        deletedAt: {
          field: 'deleted_at',
          type: Sequelize.DATE,
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
      await queryInterface.dropTable('exchange_quotations', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
