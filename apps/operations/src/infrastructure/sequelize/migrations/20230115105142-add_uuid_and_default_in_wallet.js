'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Wallets',
        'uuid',
        {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Wallets',
        'name',
        { type: Sequelize.STRING },
        { transaction },
      );
      await queryInterface.addColumn(
        'Wallets',
        'default',
        { type: Sequelize.BOOLEAN, defaultValue: true },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "Wallets"
          SET uuid = uuid_generate_v4()
        `,
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
      await queryInterface.removeColumn('Wallets', 'uuid', { transaction });
      await queryInterface.removeColumn('Wallets', 'name', { transaction });
      await queryInterface.removeColumn('Wallets', 'default', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
