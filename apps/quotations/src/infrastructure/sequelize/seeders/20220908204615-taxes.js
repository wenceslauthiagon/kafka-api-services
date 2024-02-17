'use strict';

const uuid = require('uuid');

const TAX_NAME = 'IOF';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const taxes = await queryInterface.sequelize.query(
        `SELECT id FROM "taxes" WHERE name='${TAX_NAME}' LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      if (taxes && taxes.length) return;

      await queryInterface.bulkInsert(
        'taxes',
        [
          {
            id: uuid.v4(),
            name: TAX_NAME,
            value: 38,
            format: '[VALUE]%',
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
        'taxes',
        { name: TAX_NAME },
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
