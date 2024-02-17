'use strict';

const { v4: uuidV4 } = require('uuid');

const ZROBANK_ISPB = '26264220';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const zroBank = await queryInterface.sequelize.query(
        `SELECT id FROM "banks" WHERE ispb='${ZROBANK_ISPB}' LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      if (zroBank && zroBank.length) return;

      await queryInterface.bulkInsert(
        'banks',
        [
          {
            id: uuidV4(),
            ispb: ZROBANK_ISPB,
            name: 'ZRO PAGAMENTOS S.A.',
            full_name: 'ZRO PAGAMENTOS S.A.',
            active: true,
            started_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
        'banks',
        { ispb: ZROBANK_ISPB },
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
