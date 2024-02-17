'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_key_claims',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          keyType: {
            field: 'key_type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          key: {
            field: 'key',
            type: Sequelize.STRING,
            allowNull: false,
          },
          type: {
            field: 'type',
            type: Sequelize.STRING,
            allowNull: false,
          },
          status: {
            field: 'status',
            type: Sequelize.STRING,
            allowNull: false,
          },
          ispb: {
            field: 'ispb',
            type: Sequelize.STRING,
            allowNull: false,
          },
          document: {
            field: 'document',
            type: Sequelize.STRING,
            allowNull: false,
          },
          branch: {
            field: 'branch',
            type: Sequelize.STRING,
            allowNull: true,
          },
          accountNumber: {
            field: 'account_number',
            type: Sequelize.STRING,
            allowNull: true,
          },
          personType: {
            field: 'person_type',
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
      await queryInterface.dropTable('pix_key_claims', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
