'use strict';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await Promise.all([
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'user_id',
          {
            type: 'UUID USING CAST("user_id" as UUID)',
          },
          { transaction },
        ),
        queryInterface.changeColumn(
          'pix_decoded_keys',
          'account_number',
          {
            type: 'VARCHAR(255) USING CAST("account_number" as VARCHAR(255))',
          },
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
      await queryInterface.changeColumn(
        'pix_decoded_keys',
        'user_id',
        {
          type: Sequelize.STRING,
        },
        { transaction },
      );
      await queryInterface.changeColumn(
        'pix_decoded_keys',
        'account_number',
        {
          type: 'uuid USING account_number::uuid',
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
};
