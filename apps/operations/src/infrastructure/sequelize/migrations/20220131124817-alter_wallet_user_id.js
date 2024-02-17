'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add user_uuid column
      await queryInterface.addColumn(
        'Wallets',
        'user_uuid',
        {
          field: 'user_uuid',
          type: Sequelize.UUID,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        'update "Wallets" set user_uuid = (select uuid from "Users" where "Users".id = "Wallets".user_id)',
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
      CREATE OR REPLACE FUNCTION update_row_user_id_on_wallets()
      RETURNS trigger
      AS $$
          begin
	          if new.user_uuid is null
	      	    then
    	          UPDATE "Wallets" set user_uuid = (select uuid from "Users" where id = new.user_id) where user_id = new.user_id;
            end if;
            return new;
          end;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER UPDATE_USER_UUID
        AFTER INSERT ON "Wallets" 
        FOR EACH ROW EXECUTE PROCEDURE update_row_user_id_on_wallets();
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

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Wallets', 'user_uuid', {
        transaction,
      });
      await queryInterface.sequelize.query(
        'DROP TRIGGER UPDATE_USER_UUID ON "Wallets"',
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
