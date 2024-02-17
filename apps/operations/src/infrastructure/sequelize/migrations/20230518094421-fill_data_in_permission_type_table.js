const { v4: uuidV4 } = require('uuid');

const actions = [
  {
    tag: 'ROOT',
    description: 'User root',
  },
  {
    tag: 'ADMIN',
    description: 'User admin',
  },
  {
    tag: 'CLIENT',
    description: 'User client',
  },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const action_ids = await queryInterface.sequelize.query(
        'SELECT id FROM "permission_types" WHERE tag IN (:tag)',
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { tag: actions.map(({ tag }) => tag) },
        },
      );

      if (action_ids.length) return;

      await queryInterface.bulkInsert(
        'permission_types',
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

  down: async () => console.log('Nothing to do.'),
};
