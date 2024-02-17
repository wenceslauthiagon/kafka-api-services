const { v4: uuidV4 } = require('uuid');

const actions = [
  {
    tag: 'api-users-delete-pix-keys-by-id-portabilities-cancel',
    description: 'Canceling a portability claim that is in process',
  },
  {
    tag: 'api-users-delete-pix-keys-by-id-claims-cancel',
    description: 'Canceling a ownership claim that is in process',
  },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert(
        'permission_actions',
        actions.map((action) => ({
          ...action,
          id: uuidV4(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        { transaction },
      );

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
        { tag: { [Op.in]: actions.map(({ tag }) => tag) } },
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
