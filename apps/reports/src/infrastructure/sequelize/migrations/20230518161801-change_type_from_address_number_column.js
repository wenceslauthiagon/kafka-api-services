'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE report_users ALTER COLUMN address_number TYPE integer USING address_number::integer',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER TABLE report_users_legal_representor ALTER COLUMN address_number TYPE integer USING address_number::integer',
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
      await queryInterface.sequelize.query(
        'ALTER TABLE report_users ALTER COLUMN address_number TYPE varchar USING address_number::varchar',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'ALTER TABLE report_users_legal_representor ALTER COLUMN address_number TYPE varchar USING address_number::varchar',
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
