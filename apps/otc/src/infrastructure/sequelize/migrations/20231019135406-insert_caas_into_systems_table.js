'use strict';
const uuid = require('uuid');

const SYSTEM_TABLE = 'systems';
const SYSTEM_NAME = 'CAAS';
const SYSTEM_DESCRIPTION = 'Zrobank CaaS';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkInsert(
        SYSTEM_TABLE,
        [
          {
            id: uuid.v4(),
            name: SYSTEM_NAME,
            description: SYSTEM_DESCRIPTION,
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
        SYSTEM_TABLE,
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
