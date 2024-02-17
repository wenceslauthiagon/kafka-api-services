'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Limit_types',
        'transaction_type_id',
        { type: Sequelize.INTEGER, allowNull: true },
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

      const transactionTypeChange = await queryInterface.sequelize.query(
        `SELECT id from "Transaction_types" WHERE tag='PIXCHANGE'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      const transactionTypeWithdrawal = await queryInterface.sequelize.query(
        `SELECT id from "Transaction_types" WHERE tag='PIXWITHDRAWAL'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      const transactionTypeChatCharge = await queryInterface.sequelize.query(
        `SELECT id from "Transaction_types" WHERE tag='P2PTC'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      const transactionTypeTED = await queryInterface.sequelize.query(
        `SELECT id from "Transaction_types" WHERE tag='TED'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      const transactionTypePixSend = await queryInterface.sequelize.query(
        `SELECT id from "Transaction_types" WHERE tag='PIXSEND'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      await Promise.all([
        queryInterface.sequelize.query(
          `UPDATE "Limit_types"
         SET transaction_type_id = ${transactionTypeChange[0].id}
         WHERE tag='PIXCHANGE'`,
          { transaction },
        ),
        queryInterface.sequelize.query(
          `UPDATE "Limit_types"
         SET transaction_type_id = ${transactionTypeWithdrawal[0].id}
         WHERE tag='PIXWITHDRAWAL'`,
          { transaction },
        ),
        queryInterface.sequelize.query(
          `UPDATE "Limit_types"
         SET transaction_type_id = ${transactionTypeChatCharge[0].id}
         WHERE tag='BRLP2P'`,
          { transaction },
        ),
        queryInterface.sequelize.query(
          `UPDATE "Limit_types"
         SET transaction_type_id = ${transactionTypeTED[0].id}
         WHERE tag='TEDSELF'`,
          { transaction },
        ),
        queryInterface.sequelize.query(
          `UPDATE "Limit_types"
         SET transaction_type_id = ${transactionTypePixSend[0].id}
         WHERE tag='PIXSEND'`,
          { transaction },
        ),
      ]);

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
      await queryInterface.removeColumn('Limit_types', 'transaction_type_id', {
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
