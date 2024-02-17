'use strict';

const ZIP_CODE = '01386165';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const addressTypes = await queryInterface.sequelize.query(
        'SELECT id FROM "Addresses_types" ORDER BY id LIMIT 1',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      if (!addressTypes || !addressTypes.length) return;

      const users = await queryInterface.sequelize.query(
        'SELECT id FROM "Users" ORDER BY id LIMIT 1',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction },
      );

      if (!users || !users.length) return;

      const idAddressType = addressTypes[0].id;
      const userId = users[0].id;

      await queryInterface.bulkInsert(
        'Addresses',
        [
          {
            idAddressType,
            user_id: userId,
            zipCode: ZIP_CODE,
            street: '55001 Xavier Marginal',
            number: 9130,
            neighborhood: 'Lynn',
            city: 'South Whittier',
            federativeUnit: 'Saginaw',
            country: 'República Dominicana',
            mailingAddress: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
        'Addresses',
        { zipCode: ZIP_CODE },
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
