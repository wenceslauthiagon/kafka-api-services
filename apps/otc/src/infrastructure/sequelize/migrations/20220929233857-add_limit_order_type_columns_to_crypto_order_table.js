'use strict';
const { v4: uuidV4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'crypto_orders',
        'price',
        {
          type: Sequelize.BIGINT,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'crypto_orders',
        'stop_price',
        {
          type: Sequelize.BIGINT,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'crypto_orders',
        'valid_until',
        {
          type: Sequelize.DATE,
        },
        { transaction },
      );

      const id = uuidV4();

      await queryInterface.sequelize.query(
        `
        INSERT INTO systems (id, name, description, created_at, updated_at) VALUES('${id}', 'OTC_BOT', 'Zrobank Otc Bot', now(), now())
        `,
        { transaction },
      );

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
      await queryInterface.removeColumn('crypto_orders', 'price', {
        transaction,
      });

      await queryInterface.removeColumn('crypto_orders', 'stop_price', {
        transaction,
      });

      await queryInterface.removeColumn('crypto_orders', 'valid_until', {
        transaction,
      });

      await queryInterface.sequelize.query(
        `
        DELETE FROM systems where name =  'OTC_BOT'
        `,
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
