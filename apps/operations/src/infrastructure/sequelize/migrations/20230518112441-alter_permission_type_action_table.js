'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await Promise.all([
        queryInterface.changeColumn(
          'permission_type_actions',
          'permission_type_tag',
          {
            type: Sequelize.STRING,
            references: {
              model: 'permission_types',
              key: 'tag',
            },
          },
          { transaction },
        ),
        queryInterface.changeColumn(
          'permission_type_actions',
          'permission_action_tag',
          {
            type: Sequelize.STRING,
            references: {
              model: 'permission_actions',
              key: 'tag',
            },
          },
          { transaction },
        ),
        queryInterface.sequelize.query(
          'ALTER TABLE permission_type_actions ADD CONSTRAINT permission_type_actions_both_tag_key UNIQUE (permission_type_tag, permission_action_tag)',
          { transaction },
        ),
        queryInterface.bulkDelete(
          'permission_type_actions',
          { permission_type_tag: 'ROOT' },
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

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE permission_type_actions DROP CONSTRAINT permission_type_actions_both_tag_key;',
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
