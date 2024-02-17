'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE FUNCTION replication_wallet_accounts()
        RETURNS trigger
        AS 
        $$
          BEGIN
            if new.id = (select id from wallet_account_caches where id = new.id ) 
              THEN
                UPDATE wallet_account_caches SET 
                  wallet_id = new.wallet_id,
                  wallet_uuid = new.wallet_uuid,
                  id = new.id,
                  uuid = new.uuid,
                  receive_address = new.receive_address,
                  currency_id = new.currency_id,
                  balance = new.balance,
                  pending_amount = new.pending_amount,
                  state = new.state,
                  created_at = new.created_at,
                  updated_at = new.updated_at,
                  nested_address = new.nested_address,
                  branch_number = new.topazio_branch_number,
                  account_number = new.topazio_account_number,
                  account_id = new.account_id,
                  dock_balance = new.dock_balance,
                  last_reconciled_at = new.last_reconciled_at,
                  average_price = new.avg_price,
                  accumulated_brl = new.accumulated_brl,
                  accumulated_coin = new.accumulated_coin,
                  migration_terms_accepted_at = new.migration_terms_accepted_at
                WHERE id = new.id;
            else
              INSERT INTO wallet_account_caches
                (
                  id,
                  uuid,
                  wallet_id,
                  wallet_uuid,
                  receive_address,
                  currency_id,
                  balance,
                  pending_amount,
                  state,
                  created_at,
                  updated_at,
                  nested_address,
                  branch_number,
                  account_number,
                  account_id,
                  dock_balance,
                  last_reconciled_at,
                  average_price,
                  accumulated_brl,
                  accumulated_coin,
                  migration_terms_accepted_at
                )
                VALUES
                  (
                    new.id,
                    new.uuid,
                    new.wallet_id,
                    new.wallet_uuid,
                    new.receive_address,
                    new.currency_id,
                    new.balance,
                    new.pending_amount,
                    new.state,
                    new.created_at,
                    new.updated_at,
                    new.nested_address,
                    new.topazio_branch_number,
                    new.topazio_account_number,
                    new.account_id,
                    new.dock_balance,
                    new.last_reconciled_at,
                    new.avg_price,
                    new.accumulated_brl,
                    new.accumulated_coin,
                    new.migration_terms_accepted_at
                  );
            end if;

            return new;

          END
        $$
        LANGUAGE plpgsql;
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
