'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'Referral_rewards',
        'awarded_to_uuid',
        { type: Sequelize.UUID, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'Referral_rewards',
        'awarded_by_uuid',
        { type: Sequelize.UUID, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'Referral_rewards',
        'group_id',
        { type: Sequelize.UUID, allowNull: true },
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
      await queryInterface.removeColumn('Referral_rewards', 'awarded_to_uuid', {
        transaction,
      });
      await queryInterface.removeColumn('Referral_rewards', 'awarded_by_uuid', {
        transaction,
      });
      await queryInterface.removeColumn('Referral_rewards', 'group_id', {
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
