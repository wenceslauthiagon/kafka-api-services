'use strict';

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'Admins',
      },
      ['email'],
      {
        name: 'Admin_email_key',
        transaction,
      },
    );

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'Admins',
      },
      ['role_id'],
      {
        name: 'Admin_role_id_key',
        transaction,
      },
    );

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'Admin_perms',
      },
      ['section', 'title'],
      {
        name: 'Admin_perms_section_title_key',
        transaction,
      },
    );

    await queryInterface.addIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'Admin_roles_perms',
      },
      ['role_id', 'perm_id'],
      {
        name: 'Admin_roles_perms_role_id_perm_id_key',
        transaction,
      },
    );
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'Admins',
      },
      ['email'],
      {
        name: 'Admin_email_key',
        transaction,
      },
    );

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'Admins',
      },
      ['role_id'],
      {
        name: 'Admin_role_id_key',
        transaction,
      },
    );

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'Admin_perms',
      },
      ['section', 'title'],
      {
        name: 'Admin_perms_section_title_key',
        transaction,
      },
    );

    await queryInterface.removeIndex(
      {
        schema: process.env.APP_DATABASE_SCHEMA,
        tableName: 'Admin_roles_perms',
      },
      ['role_id', 'perm_id'],
      {
        name: 'Admin_roles_perms_role_id_perm_id_key',
        transaction,
      },
    );
  },
};
