'use strict';

const EMAIL = 'admin@zrobank.com.br';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM "Admins" WHERE email='${EMAIL}' ORDER BY id LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      if (users && users.length) return;

      const roles = await queryInterface.sequelize.query(
        'SELECT id FROM "Admin_roles" ORDER BY id LIMIT 1',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      if (!roles || !roles.length) return;

      const roleId = roles[0].id;

      await queryInterface.bulkInsert(
        'Admins',
        [
          {
            name: 'Admin',
            email: EMAIL,
            password:
              '$2a$10$4NId/yZ.KbeMCcrUx8qzcuM31dzAkJT.YqszZ39hFNzrQc8sTNZX6',
            role_id: roleId,
            active: true,
            exclude: true,
            reset_token: 'test',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            rr_class: 'KYC',
          },
        ],
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
      await queryInterface.bulkDelete(
        'Admins',
        { email: EMAIL },
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
