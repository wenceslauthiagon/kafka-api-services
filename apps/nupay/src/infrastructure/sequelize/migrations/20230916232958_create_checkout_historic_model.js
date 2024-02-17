'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'checkout_historics_nupay',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          checkoutId: {
            type: Sequelize.UUID,
            allowNull: false,
            field: 'checkout_id',
            references: {
              model: 'checkouts_nupay',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          currentStatus: {
            type: Sequelize.STRING,
            field: 'current_status',
            allowNull: false,
          },
          previousStatus: {
            type: Sequelize.STRING,
            field: 'previous_status',
            allowNull: true,
          },
          action: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          response: {
            type: Sequelize.JSONB,
            allowNull: true,
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
        {
          transaction,
        },
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
      await queryInterface.dropTable('checkout_historics_nupay');
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
