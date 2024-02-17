module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'email_templates',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.UUIDV4,
          },
          title: {
            field: 'title',
            type: Sequelize.STRING,
            defaultValue: null,
          },
          body: {
            field: 'body',
            type: Sequelize.TEXT,
            defaultValue: null,
          },
          html: {
            field: 'html',
            type: Sequelize.TEXT,
            defaultValue: null,
          },
          tag: {
            field: 'tag',
            type: Sequelize.STRING,
            allowNull: false,
          },
          markups: {
            field: 'markups',
            type: Sequelize.ARRAY(Sequelize.STRING),
            defaultValue: null,
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
        { transaction },
      );

      await queryInterface.createTable(
        'emails',
        {
          id: {
            field: 'id',
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.UUIDV4,
          },
          userId: {
            field: 'user_id',
            type: Sequelize.UUID,
            allowNull: true,
          },
          to: {
            field: 'to',
            type: Sequelize.STRING,
            allowNull: false,
          },
          from: {
            field: 'from',
            type: Sequelize.STRING,
            allowNull: false,
          },
          title: {
            field: 'title',
            type: Sequelize.STRING,
            allowNull: false,
          },
          body: {
            field: 'body',
            type: Sequelize.TEXT,
            defaultValue: null,
          },
          html: {
            field: 'html',
            type: Sequelize.TEXT,
            defaultValue: null,
          },
          issuedBy: {
            field: 'issued_by',
            type: Sequelize.UUID,
            defaultValue: null,
          },
          templateId: {
            field: 'template_id',
            type: Sequelize.UUID,
            defaultValue: null,
          },
          state: {
            field: 'state',
            type: Sequelize.ENUM('PENDING', 'SENT', 'FAILED'),
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
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('emails', { transaction });
      await queryInterface.dropTable('email_templates', { transaction });
      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },
};
