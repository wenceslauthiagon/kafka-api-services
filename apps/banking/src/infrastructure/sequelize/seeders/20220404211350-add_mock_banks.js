'use strict';

const { v4: uuidV4 } = require('uuid');

const MOCK_BANK_ISPB_1 = '11111111';
const MOCK_BANK_ISPB_2 = '22222222';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    const payload = [];

    try {
      const bank1 = await queryInterface.sequelize.query(
        `SELECT id FROM "banks" WHERE ispb='${MOCK_BANK_ISPB_1}' LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      if (!bank1 || !bank1.length) {
        payload.push({
          id: uuidV4(),
          ispb: MOCK_BANK_ISPB_1,
          name: 'Mock Bank First',
          full_name: 'Mock Bank First S.A.',
          active: true,
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      const bank2 = await queryInterface.sequelize.query(
        `SELECT id FROM "banks" WHERE ispb='${MOCK_BANK_ISPB_2}' LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      if (!bank2 || !bank2.length) {
        payload.push({
          id: uuidV4(),
          ispb: MOCK_BANK_ISPB_2,
          name: 'Mock Bank Second',
          full_name: 'Mock Bank Second S.A.',
          active: true,
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (!payload.length) return;

      await queryInterface.bulkInsert('banks', payload, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const Op = Sequelize.Op;
    try {
      await queryInterface.bulkDelete(
        'banks',
        { ispb: { [Op.in]: [MOCK_BANK_ISPB_1, MOCK_BANK_ISPB_2] } },
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
