'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('users_legal_additional_info', {
        id: {
          field: 'id',
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        userId: {
          field: 'user_id',
          type: Sequelize.UUID,
          allowNull: false,
        },
        cnae: {
          field: 'cnae',
          type: Sequelize.STRING,
        },
        constitutionDesc: {
          field: 'constitution_desc',
          type: Sequelize.STRING,
        },
        employeeQty: {
          field: 'employee_qty',
          type: Sequelize.INTEGER,
        },
        overseasBranchesQty: {
          field: 'overseas_branches_qty',
          type: Sequelize.INTEGER,
        },
        isThirdPartyRelationship: {
          field: 'is_third_party_relashionship',
          type: Sequelize.BOOLEAN,
        },
        isCreditCardAdministrator: {
          field: 'is_credit_card_admin',
          type: Sequelize.BOOLEAN,
        },
        isPatrimonyTrust: {
          field: 'is_patrimony_trust',
          type: Sequelize.BOOLEAN,
        },
        isPaymentFacilitator: {
          field: 'is_payment_facilitator',
          type: Sequelize.BOOLEAN,
        },
        isRegulatedPld: {
          field: 'is_regulated_pld',
          type: Sequelize.BOOLEAN,
        },
        legalNaturityCode: {
          field: 'legal_naturity_code',
          type: Sequelize.STRING,
        },
        createdAt: {
          field: 'created_at',
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Date.now(),
        },
        updatedAt: {
          field: 'updated_at',
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Date.now(),
        },
      });

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
      await queryInterface.dropTable('users_legal_additional_info', {
        transaction,
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
