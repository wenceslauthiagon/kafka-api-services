'use strict';

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.renameColumn(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'report_users',
        },
        'is_third_party_relashionship',
        'is_third_party_relationship',
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.renameColumn(
        {
          schema: process.env.APP_DATABASE_SCHEMA,
          tableName: 'report_users',
        },
        'is_third_party_relationship',
        'is_third_party_relashionship',
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
