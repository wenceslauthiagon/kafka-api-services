'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'pix_payments',
        'owner_person_type',
        {
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE pix_payments SET owner_person_type='NATURAL_PERSON' WHERE owner_person_type IS NULL
        `,
        { transaction },
      );

      await queryInterface.changeColumn(
        'pix_payments',
        'owner_person_type',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('pix_payments', 'owner_person_type', {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
