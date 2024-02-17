const { v4: uuidV4 } = require('uuid');

const actions = [
  {
    tag: 'api-paas-get-pix-deposits-qr-codes',
    description: "List user's QR codes",
  },
  {
    tag: 'api-paas-post-pix-deposits-qr-codes',
    description: 'Create a static QR Code',
  },
  {
    tag: 'api-paas-get-pix-deposits-qr-codes-by-id',
    description: "Get a user's QR code by id",
  },
  {
    tag: 'api-paas-delete-pix-deposits-qr-codes-by-id',
    description: "Delete user's QR code",
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
