'use strict';

const TRANSACTION_TYPE_TABLE = 'Transaction_types';
const TRANSACTION_TYPE_TITLE = 'Confisco Gateway';
const TRANSACTION_TYPE_TAG = 'CONFISCOGTW';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkInsert(
        TRANSACTION_TYPE_TABLE,
        [
          {
            title: TRANSACTION_TYPE_TITLE,
            tag: TRANSACTION_TYPE_TAG,
            method: 'A2B',
            state: 'active',
            participants: 'OWNER',
          },
        ],
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
      await queryInterface.bulkDelete(
        TRANSACTION_TYPE_TABLE,
        { tag: TRANSACTION_TYPE_TAG },
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
