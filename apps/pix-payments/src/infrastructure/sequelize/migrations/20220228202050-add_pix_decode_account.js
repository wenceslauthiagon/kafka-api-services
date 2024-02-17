'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'pix_decoded_account',
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
          props: {
            field: 'props',
            type: Sequelize.JSONB,
            allowNull: true,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          tradeName: {
            field: 'trade_name',
            type: Sequelize.STRING,
            allowNull: true,
          },
          bankIspb: {
            field: 'bank_ispb',
            allowNull: false,
            type: Sequelize.STRING,
          },
          bankName: {
            field: 'bank_name',
            allowNull: false,
            type: Sequelize.STRING,
          },
          branch: {
            allowNull: false,
            type: Sequelize.STRING,
          },
          accountNumber: {
            field: 'account_number',
            type: Sequelize.STRING,
            allowNull: false,
          },
          document: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          state: {
            allowNull: false,
            type: Sequelize.ENUM('PENDING_PAYMENT', 'CONFIRMED_PAYMENT'),
            defaultValue: 'PENDING_PAYMENT',
          },
          personType: {
            field: 'person_type',
            allowNull: false,
            type: Sequelize.ENUM('NATURAL_PERSON', 'LEGAL_PERSON'),
          },
          accountType: {
            field: 'account_type',
            allowNull: false,
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
      await queryInterface.dropTable('pix_decoded_account', { transaction });
      await queryInterface.dropEnum('enum_pix_decoded_account_state', {
        transaction,
      });
      await queryInterface.dropEnum('enum_pix_decoded_account_person_type', {
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
