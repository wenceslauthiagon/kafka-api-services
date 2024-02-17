'use strict';
const { v4: uuidV4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('permission_actions', [
        {
          tag: 'api-paas-post-pix-deposits-qr-codes-dynamic-due-date',
          description:
            'Creates permission to insert into the permission_actions table for the qr code dynamic due date',
          id: uuidV4(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]),
        { transaction };
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const Op = Sequelize.Op;

    try {
      await queryInterface.bulkDelete(
        'permission_actions',
        {
          tag: {
            [Op.in]: ['api-paas-post-pix-deposits-qr-codes-dynamic-due-date'],
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
};
