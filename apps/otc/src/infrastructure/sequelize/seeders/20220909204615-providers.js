'use strict';

const uuid = require('uuid');

const PROVIDER_NAMES = ['APILAYER', 'FTX', 'MERCADO_BITCOIN'];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const providers = await queryInterface.sequelize.query(
        `SELECT id FROM "Providers" WHERE name IN (:names) LIMIT 1`,
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { names: PROVIDER_NAMES },
        },
      );

      if (providers && providers.length) return;

      await queryInterface.bulkInsert(
        'Providers',
        PROVIDER_NAMES.map((name) => ({
          id: uuid.v4(),
          name,
          description: name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        { transaction },
      );
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
        'Providers',
        {
          name: { [Op.in]: PROVIDER_NAMES },
        },
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
