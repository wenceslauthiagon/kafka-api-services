'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('pix_infractions', 'payment_id', {
        transaction,
      });

      await queryInterface.addColumn(
        'pix_infractions',
        'transaction_id',
        {
          field: 'transaction_id',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_infractions',
        'transaction_type',
        {
          field: 'transaction_type',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_infractions',
        'failed_code',
        {
          field: 'failed_code',
          type: Sequelize.STRING,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'pix_infractions',
        'failed_message',
        {
          field: 'failed_message',
          type: Sequelize.STRING,
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
      await queryInterface.addColumn(
        'pix_infractions',
        'payment_id',
        {
          field: 'payment_id',
          allowNull: false,
          type: Sequelize.UUID,
        },
        {
          transaction,
        },
      );

      await queryInterface.removeColumn('pix_infractions', 'transaction_id', {
        transaction,
      });

      await queryInterface.removeColumn('pix_infractions', 'transaction_type', {
        transaction,
      });

      await queryInterface.removeColumn('pix_infractions', 'failed_code', {
        transaction,
      });

      await queryInterface.removeColumn('pix_infractions', 'failed_message', {
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
