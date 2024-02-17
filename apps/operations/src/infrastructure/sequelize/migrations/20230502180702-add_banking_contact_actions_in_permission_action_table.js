const { v4: uuidV4 } = require('uuid');

const actions = [
  {
    tag: 'api-users-get-all-banking-contact',
    description: 'Get all banking contacts',
  },
  {
    tag: 'api-users-delete-banking-account-contact',
    description: 'Delete banking account contact',
  },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const action_ids = await queryInterface.sequelize.query(
        'SELECT id FROM "permission_actions" WHERE tag IN (:tag)',
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { tag: actions.map(({ tag }) => tag) },
        },
      );

      if (action_ids.length) return;

      await queryInterface.bulkInsert(
        'permission_actions',
        actions.map((item) => ({
          ...item,
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
