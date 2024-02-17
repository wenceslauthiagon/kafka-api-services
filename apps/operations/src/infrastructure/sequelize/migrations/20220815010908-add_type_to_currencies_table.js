'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Currencies',
        'type',
        {
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Currencies" set type = 'FIAT' where symbol in ('BRL', 'USD', 'EUR')
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "Currencies" set type = 'CRYPTO' where symbol not in ('BRL', 'USD', 'EUR')
      `,
        { transaction },
      );

      await queryInterface.changeColumn(
        'Currencies',
        'type',
        {
          type: Sequelize.STRING,
          allowNull: false,
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Currencies', 'type', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
