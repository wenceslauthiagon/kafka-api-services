'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'signup',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: true,
            defaultValue: null,
          },
          duplicateId: {
            field: 'duplicate_id',
            type: Sequelize.UUID,
            allowNull: true,
            defaultValue: null,
          },
          name: {
            field: 'name',
            type: Sequelize.STRING,
            allowNull: false,
          },
          phoneNumber: {
            field: 'phone_number',
            type: Sequelize.STRING,
            allowNull: false,
          },
          password: {
            field: 'password',
            type: Sequelize.STRING,
            allowNull: false,
          },
          confirmCode: {
            field: 'confirm_code',
            type: Sequelize.STRING,
            allowNull: true,
          },
          confirmAttempts: {
            field: 'confirm_attempts',
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          referralCode: {
            field: 'referral_code',
            type: Sequelize.STRING,
            allowNull: true,
          },
          state: {
            field: 'state',
            type: Sequelize.STRING,
            allowNull: false,
          },
          createdAt: {
            field: 'created_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
          updatedAt: {
            field: 'updated_at',
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        {
          transaction,
        },
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
      await queryInterface.dropTable('signup', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      throw error;
    }
  },
};
