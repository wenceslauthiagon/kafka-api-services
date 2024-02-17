'use strict';

const { v4: uuidV4 } = require('uuid');

const limits = [
  {
    id: uuidV4(),
    limit: 100,
    person_type: 'LEGAL_PERSON',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: uuidV4(),
    limit: 100,
    person_type: 'NATURAL_PERSON',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const limit = await queryInterface.sequelize.query(
        `SELECT id FROM "pix_key_decode_limits" ORDER BY id LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      if (limit && limit.length) return;

      await queryInterface.bulkInsert('pix_key_decode_limits', limits, {
        transaction,
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
      await queryInterface.bulkDelete(
        'pix_key_decode_limits',
        {},
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
