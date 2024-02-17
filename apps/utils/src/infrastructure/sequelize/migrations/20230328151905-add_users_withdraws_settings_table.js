'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'users_withdraws_settings',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          state: {
            field: 'state',
            type: Sequelize.STRING,
            allowNull: false,
          },
          type: {
            field: 'type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          balance: {
            field: 'balance',
            type: Sequelize.BIGINT,
            allowNull: false,
          },
          day: {
            field: 'day',
            type: Sequelize.INTEGER,
            defaultValue: null,
          },
          weekDay: {
            field: 'week_day',
            type: Sequelize.STRING,
            defaultValue: null,
          },
          walletId: {
            field: 'wallet_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          transactionTypeTag: {
            field: 'transaction_type_tag',
            type: Sequelize.STRING,
            allowNull: false,
          },
          pixKeyValue: {
            field: 'pix_key_value',
            type: Sequelize.STRING,
            allowNull: false,
          },
          pixKeyType: {
            field: 'pix_key_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          createdAt: {
            field: 'created_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          updatedAt: {
            field: 'updated_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
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
      await queryInterface.dropTable('users_withdraws_settings', {
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
