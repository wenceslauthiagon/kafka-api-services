'use strict';

const uuid = require('uuid');

const SYSTEM_NAME = 'ZROBANK';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const systems = await queryInterface.sequelize.query(
        `SELECT id FROM "systems" WHERE name='${SYSTEM_NAME}' LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      if (systems && systems.length) return;

      await queryInterface.bulkInsert(
        'systems',
        [
          {
            id: uuid.v4(),
            name: SYSTEM_NAME,
            description: SYSTEM_NAME,
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
        'systems',
        { name: SYSTEM_NAME },
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
