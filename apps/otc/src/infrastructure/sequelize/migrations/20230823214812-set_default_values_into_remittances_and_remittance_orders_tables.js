'use strict';

const B2C2_PROVIDER_NAME = 'B2C2';
const DEFAULT_FLUX_CODE = 'D0';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Get B2C2 provider ID.
      const response = await queryInterface.sequelize.query(
        `SELECT id, name FROM "Providers" WHERE name ilike (:name)`,
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: { name: B2C2_PROVIDER_NAME },
        },
      );

      if (!response?.length) return;

      const b2c2Provider = response[0];

      // Set default values into Remittances.
      await queryInterface.sequelize.query(
        `UPDATE "Remittances" SET provider_id = (:providerId), provider_name = (:providerName), send_date_code = (:defaultFluxCode), receive_date_code = (:defaultFluxCode) WHERE send_date_code IS NULL`,
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: {
            providerId: b2c2Provider.id,
            providerName: b2c2Provider.name,
            defaultFluxCode: DEFAULT_FLUX_CODE,
          },
        },
      );

      // Set default values into remittance_orders.
      await queryInterface.sequelize.query(
        `UPDATE "remittance_orders" SET send_date_code = (:defaultFluxCode), receive_date_code = (:defaultFluxCode) WHERE send_date_code IS NULL`,
        {
          transaction,
          type: queryInterface.sequelize.QueryTypes.SELECT,
          replacements: {
            defaultFluxCode: DEFAULT_FLUX_CODE,
          },
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },

  async down() {
    console.log('Not possible to revert this migration.');
  },
};
