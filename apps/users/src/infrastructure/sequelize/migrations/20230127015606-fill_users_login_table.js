'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
          UPDATE "Users"
          SET root_id = uuid_generate_v4()
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          INSERT INTO users_login (
            id,
            password, pin, has_pin,
            document, name, full_name,
            phone_number, email, active,
            default_wallet_id
          )
          SELECT
            u.root_id,
            u.password, u.pin, u.pin_has_created,
            u.cpf, u.name, u.full_name,
            u.phone_number, u.email, u.active,
            w.uuid
          FROM
            "Users" u
          JOIN "Wallets" w ON w.user_id = u.id
          WHERE
            u.deleted_at is null
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          CREATE FUNCTION update_user_login()
          RETURNS TRIGGER LANGUAGE plpgsql AS
          $$
            BEGIN
              UPDATE users_login
              SET (
                password, pin, has_pin,
                document, name, full_name,
                phone_number, email, active
              ) = (
                new.password, new.pin, new.pin_has_created,
                new.cpf, new.name, new.full_name,
                new.phone_number, new.email, new.active
              )
              WHERE
                users_login.id = new.root_id;
              RETURN new;
            END;
          $$;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          CREATE TRIGGER update_user_login_after_user_update AFTER UPDATE ON
          "Users"
          FOR EACH ROW
          EXECUTE PROCEDURE update_user_login();
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
  down: async () => console.log('Nothing to do.'),
};
