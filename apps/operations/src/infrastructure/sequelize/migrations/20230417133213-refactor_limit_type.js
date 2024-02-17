'use strict';

const { v4: uuidV4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Transaction_types',
        'limit_type_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        {
          transaction,
        },
      );

      const limitTypes = await queryInterface.sequelize.query(
        'SELECT id, transaction_type_id from "Limit_types"',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      for (const limitType of limitTypes) {
        await queryInterface.sequelize.query(
          `UPDATE "Transaction_types"
           SET limit_type_id = ${limitType.id}
           WHERE id = ${limitType.transaction_type_id}`,
          {
            transaction,
          },
        );
      }

      await queryInterface.removeColumn('Limit_types', 'transaction_type_id', {
        transaction,
      });

      const currency = await queryInterface.sequelize.query(
        `SELECT id from "Currencies" WHERE tag='REAL'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      await queryInterface.bulkInsert(
        'Limit_types',
        [
          {
            tag: 'PIXWITHDRAWALCHANGE',
            description: 'Limite para saque e troco via PIX',
            period_start: 'DATE',
            check: 'OWNER',
            currency_id: currency[0].id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        {
          transaction,
        },
      );

      const limitType = await queryInterface.sequelize.query(
        `SELECT id from "Limit_types" WHERE tag='PIXWITHDRAWALCHANGE'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE "Transaction_types"
         SET limit_type_id = ${limitType[0].id}
         WHERE tag='PIXCHANGE'`,
        {
          transaction,
        },
      );

      await queryInterface.sequelize.query(
        `UPDATE "Transaction_types"
         SET limit_type_id = ${limitType[0].id}
         WHERE tag='PIXWITHDRAWAL'`,
        {
          transaction,
        },
      );

      await queryInterface.bulkInsert(
        'Global_limits',
        [
          {
            id: uuidV4(),
            limit_type_id: limitType[0].id,
            daily_limit: 50000,
            monthly_limit: 1550000,
            annual_limit: 18300000,
            nightly_limit: 10000,
            credit_balance: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        {
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Limit_types',
        'transaction_type_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      const transactionTypes = await queryInterface.sequelize.query(
        'SELECT id, limit_type_id from "Transaction_types"',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      for (const transactionType of transactionTypes) {
        await queryInterface.sequelize.query(
          `UPDATE "Limit_types"
           SET transaction_type_id = ${transactionType.id}
           WHERE id = ${transactionType.limit_type_id}`,
          { transaction },
        );
      }

      await queryInterface.removeColumn('Transaction_types', 'limit_type_id', {
        transaction,
      });

      const limitType = await queryInterface.sequelize.query(
        `SELECT id from "Limit_types" WHERE tag='PIXWITHDRAWALCHANGE'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      await queryInterface.bulkDelete(
        'Global_limits',
        { limit_type_id: limitType[0].id },
        { transaction },
      );

      const transactionTypeChange = await queryInterface.sequelize.query(
        `SELECT id from "Transaction_types" WHERE tag='PIXCHANGE'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      const transactionTypeWithdrawal = await queryInterface.sequelize.query(
        `SELECT id from "Transaction_types" WHERE tag='PIXWITHDRAWAL'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE "Limit_types"
         SET transaction_type_id = ${transactionTypeChange[0].id}
         WHERE tag='PIXCHANGE'`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `UPDATE "Limit_types"
         SET transaction_type_id = ${transactionTypeWithdrawal[0].id}
         WHERE tag='PIXWITHDRAWAL'`,
        { transaction },
      );

      await queryInterface.bulkDelete(
        'Limit_types',
        { id: limitType[0].id },
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
