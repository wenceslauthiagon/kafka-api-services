'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await Promise.all([
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'person_type',
          { type: Sequelize.STRING, allowNull: true },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'document',
          { type: Sequelize.STRING, allowNull: true },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'account_number',
          { type: Sequelize.STRING, allowNull: true },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'account_type',
          { type: Sequelize.STRING, allowNull: true },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'active_account',
          { type: Sequelize.BOOLEAN, allowNull: true },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'account_opening_date',
          { type: Sequelize.DATE, allowNull: true },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'key_creation_date',
          { type: Sequelize.DATE, allowNull: true },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'branch',
          { type: Sequelize.STRING, allowNull: true },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'dict_account_id',
          { type: Sequelize.STRING, allowNull: true },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'name',
          { type: Sequelize.STRING, allowNull: true },
          { transaction },
        ),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await Promise.all([
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'person_type',
          { type: Sequelize.STRING, allowNull: false },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'document',
          { type: Sequelize.STRING, allowNull: false },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'account_number',
          { type: Sequelize.STRING, allowNull: false },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'account_type',
          { type: Sequelize.STRING, allowNull: false },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'active_account',
          { type: Sequelize.BOOLEAN, allowNull: false },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'account_opening_date',
          { type: Sequelize.DATE, allowNull: false },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'key_creation_date',
          { type: Sequelize.DATE, allowNull: false },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'branch',
          { type: Sequelize.STRING, allowNull: false },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'dict_account_id',
          { type: Sequelize.STRING, allowNull: false },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'name',
          { type: Sequelize.STRING, allowNull: false },
          { transaction },
        ),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
