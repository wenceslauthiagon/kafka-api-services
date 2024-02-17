'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_key_verifications',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          pixKeyId: {
            field: 'pix_key_id',
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'pix_keys',
              key: 'id',
            },
          },
          state: {
            field: 'state',
            type: Sequelize.ENUM('OK', 'FAILED'),
            allowNull: false,
          },
          code: {
            field: 'code',
            type: Sequelize.STRING,
            allowNull: false,
            comment: 'Code sent by e-mail or SMS.',
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
      await queryInterface.dropTable('pix_key_verifications', { transaction });
      await queryInterface.dropEnum('enum_pix_key_verifications_state', {
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
