'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
          DROP TRIGGER insert_user_login_after_user_insert ON "Users";
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          DROP FUNCTION insert_user_login();
        `,
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
      await queryInterface.sequelize.query(
        `
          CREATE FUNCTION insert_user_login()
          RETURNS TRIGGER LANGUAGE plpgsql AS
          $$
            BEGIN
              INSERT INTO users_login (
                  id,
                  password, pin, has_pin,
                  document, name, full_name,
                  phone_number, email, active
                ) values (
                  new.root_id, new.password, new.pin, new.pin_has_created,
                  new.cpf, new.name, new.full_name,
                  new.phone_number, new.email, new.active
              );
              RETURN new;
            END; 
          $$;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          CREATE TRIGGER insert_user_login_after_user_insert AFTER INSERT ON
          "Users"
          FOR EACH ROW
          EXECUTE PROCEDURE insert_user_login();
        `,
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
