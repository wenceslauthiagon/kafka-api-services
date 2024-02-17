'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'bot_otc',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          name: {
            field: 'name',
            type: Sequelize.STRING,
            allowNull: false,
          },
          fromPairId: {
            field: 'from_pair_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          fromProviderId: {
            field: 'from_provider_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          toPairId: {
            field: 'to_pair_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          toProviderId: {
            field: 'to_provider_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          spread: {
            field: 'spread',
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false,
          },
          balance: {
            field: 'balance',
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false,
          },
          step: {
            field: 'step',
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false,
          },
          control: {
            field: 'control',
            type: Sequelize.STRING,
            defaultValue: 'STAND_BY',
            allowNull: false,
          },
          status: {
            field: 'status',
            type: Sequelize.STRING,
            defaultValue: 'STOPPED',
            allowNull: false,
          },
          type: {
            field: 'type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          failedCode: {
            field: 'failed_code',
            type: Sequelize.STRING,
          },
          failedMessage: {
            field: 'failed_message',
            type: Sequelize.STRING,
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
          deletedAt: {
            field: 'deleted_at',
            type: Sequelize.DATE,
            allowNull: true,
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
      await queryInterface.dropTable('bot_otc', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
