'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Wallet_accounts',
        'uuid',
        {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Wallet_accounts',
        'wallet_uuid',
        {
          type: Sequelize.UUID,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "Wallet_accounts"
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
      await queryInterface.removeColumn('Wallet_accounts', 'uuid', {
        transaction,
      });
      await queryInterface.removeColumn('Wallet_accounts', 'wallet_uuid', {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
