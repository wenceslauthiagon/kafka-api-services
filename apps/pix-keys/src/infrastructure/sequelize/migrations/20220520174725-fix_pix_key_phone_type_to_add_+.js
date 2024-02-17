'use strict';
module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `
        UPDATE pix_keys SET key=CONCAT('+', pix_keys.key) WHERE type='PHONE'
        `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        UPDATE pix_decoded_keys SET key=CONCAT('+', pix_decoded_keys.key) WHERE type='PHONE'
        `,
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
  down: async () => console.log('Nothing to do.'),
};
