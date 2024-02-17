'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addIndex('stream_pairs', ['active'], {
        transaction,
        name: 'stream_pairs_active_key',
      });

      await queryInterface.addIndex(
        'stream_pairs',
        ['active', 'gateway_name'],
        {
          transaction,
          name: 'stream_pairs_active_gateway_name_key',
        },
      );

      await queryInterface.addIndex(
        'stream_pairs',
        ['active', 'base_currency_id', 'quote_currency_id'],
        {
          transaction,
          name: 'stream_pairs_active_base_currency_id_quote_currency_id_key',
        },
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
      await queryInterface.removeIndex(
        'stream_pairs',
        'stream_pairs_active_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'stream_pairs',
        'stream_pairs_active_gateway_name_key',
        {
          transaction,
        },
      );

      await queryInterface.removeIndex(
        'stream_pairs',
        'stream_pairs_active_base_currency_id_quote_currency_id_key',
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
};
