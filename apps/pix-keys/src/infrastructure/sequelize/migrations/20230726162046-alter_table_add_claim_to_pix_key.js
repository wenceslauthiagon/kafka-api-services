'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'pix_keys',
        'claim_id',
        { type: Sequelize.UUID, defaultValue: null },
        { transaction },
      );

      await queryInterface.addIndex('pix_keys', ['claim_id'], {
        transaction,
      });
      await queryInterface.addIndex('pix_keys', ['user_id'], {
        transaction,
      });
      await queryInterface.addIndex('pix_keys', ['key'], { transaction });

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
      await queryInterface.removeColumn('pix_keys', 'claim_id', {
        transaction,
      });

      await queryInterface.removeIndex('pix_keys', ['claim_id'], {
        transaction,
      });
      await queryInterface.removeIndex('pix_keys', ['user_id'], {
        transaction,
      });
      await queryInterface.removeIndex('pix_keys', ['key'], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
