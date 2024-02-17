'use strict';
const { v4: uuidV4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('crypto_orders', 'quote_currency_id', {
        transaction,
      });

      await queryInterface.addColumn(
        'crypto_orders',
        'reconciled_id',
        { type: Sequelize.UUID },
        { transaction },
      );

      await queryInterface.addColumn(
        'crypto_orders',
        'system_id',
        { type: Sequelize.UUID },
        { transaction },
      );

      const systemId = uuidV4();
      await queryInterface.sequelize.query(
        `
        INSERT INTO systems (id, name, description, created_at, updated_at)
        VALUES('${systemId}', 'ZROBANK', 'Zrobank conversion', now(), now())
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE crypto_orders set system_id = '${systemId}'
      `,
        { transaction },
      );

      await queryInterface.changeColumn(
        'crypto_orders',
        'system_id',
        { type: Sequelize.UUID, allowNull: false },
        { transaction },
      );

      await queryInterface.removeColumn(
        'cryto_remittances',
        'system_id',
        { type: Sequelize.UUID, allowNull: false },
        { transaction },
      );

      await queryInterface.addColumn(
        'cryto_remittances',
        'deleted_at',
        { type: Sequelize.DATE },
        { transaction },
      );

      await queryInterface.changeColumn(
        'cryto_remittances',
        'executed_price',
        { type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.changeColumn(
        'cryto_remittances',
        'executed_quantity',
        { type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.changeColumn(
        'cryto_remittances',
        'fee',
        { type: Sequelize.BIGINT },
        { transaction },
      );

      await queryInterface.renameColumn(
        'cryto_remittances',
        'executed_quantity',
        'executed_amount',
        { transaction },
      );

      await queryInterface.renameTable(
        'cryto_remittances',
        'crypto_remittances',
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.renameTable(
        'crypto_remittances',
        'cryto_remittances',
        { transaction },
      );

      await queryInterface.removeColumn('crypto_orders', 'reconciled_id', {
        transaction,
      });

      await queryInterface.addColumn(
        'crypto_orders',
        'quote_currency_id',
        { type: Sequelize.UUID },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
