module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'Notifications',
        'uuid',
        {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'Notifications',
        'user_uuid',
        {
          type: Sequelize.UUID,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE FUNCTION update_notification_user_uuid() RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN UPDATE "Notifications"
        SET user_uuid = (SELECT uuid FROM "Users" WHERE id = new.user_id)
        WHERE id = new.id; RETURN new; END; $$;`,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TRIGGER insert_notifications AFTER INSERT ON
        "Notifications"
        FOR EACH ROW
        EXECUTE PROCEDURE update_notification_user_uuid();`,
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
      await queryInterface.removeColumn('Notifications', 'uuid');
      await queryInterface.removeColumn('Notifications', 'user_uuid');
      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS insert_notifications ON "Notifications";`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `DROP FUNCTION update_notification_user_uuid();`,
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  },
};
