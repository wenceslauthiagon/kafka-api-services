'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'wallet_invitations',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          walletId: {
            field: 'wallet_id',
            type: Sequelize.UUID,
            allowNull: false,
          },
          contactInformation: {
            field: 'contact_information',
            type: Sequelize.STRING,
            allowNull: false,
          },
          contactType: {
            field: 'contact_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          state: {
            field: 'state',
            type: Sequelize.STRING,
            allowNull: false,
          },
          confirmCode: {
            field: 'confirm_code',
            type: Sequelize.STRING,
            allowNull: true,
          },
          expiredAt: {
            field: 'expired_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          acceptedAt: {
            field: 'accepted_at',
            type: Sequelize.DATE,
          },
          declinedAt: {
            field: 'declined_at',
            type: Sequelize.DATE,
          },
          createdAt: {
            field: 'created_at',
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Date.now(),
          },
          updatedAt: {
            field: 'updated_at',
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Date.now(),
          },
          deletedAt: {
            field: 'deleted_at',
            type: Sequelize.DATE,
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
      await queryInterface.dropTable('wallet_invitations', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
