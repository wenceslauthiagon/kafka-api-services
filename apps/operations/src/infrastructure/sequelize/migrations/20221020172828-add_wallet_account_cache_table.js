'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'wallet_account_caches',
        {
          id: {
            field: 'id',
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          walletId: {
            field: 'wallet_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          receiveAddress: {
            field: 'receive_address',
            type: Sequelize.STRING,
          },
          currencyId: {
            field: 'currency_id',
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          balance: {
            field: 'balance',
            type: Sequelize.BIGINT,
            allowNull: false,
            defaultValue: 0,
          },
          pendingAmount: {
            field: 'pending_amount',
            type: Sequelize.BIGINT,
            allowNull: false,
            defaultValue: 0,
          },
          state: {
            field: 'state',
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'active',
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
          nestedAddress: {
            field: 'nested_address',
            type: Sequelize.STRING,
          },
          branchNumber: {
            field: 'branch_number',
            type: Sequelize.STRING,
          },
          accountNumber: {
            field: 'account_number',
            type: Sequelize.STRING,
          },
          accountId: {
            field: 'account_id',
            type: Sequelize.INTEGER,
          },
          dockBalance: {
            field: 'dock_balance',
            type: Sequelize.BIGINT,
            allowNull: false,
            defaultValue: 0,
          },
          lastReconciledAt: {
            field: 'last_reconciled_at',
            type: Sequelize.DATE,
          },
          averegePrice: {
            field: 'average_price',
            type: Sequelize.BIGINT,
            allowNull: false,
            defaultValue: 0,
          },
          accumulatedBrl: {
            field: 'accumulated_brl',
            type: Sequelize.BIGINT,
            allowNull: false,
            defaultValue: 0,
          },
          accumulatedCoin: {
            field: 'accumulated_coin',
            type: Sequelize.BIGINT,
            allowNull: false,
            defaultValue: 0,
          },
          migrationTermsAcceptedAt: {
            field: 'migration_terms_accepted_at',
            type: Sequelize.DATE,
          },
          deletedAt: {
            field: 'deleted_at',
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

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
                  id = new.id,
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
                VALUES
                  (
                    new.id,
                    new.wallet_id,
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

      CREATE TRIGGER WALLET_ACCOUNTS_REPLICATION
        AFTER INSERT or UPDATE  ON "Wallet_accounts" 
        FOR EACH ROW EXECUTE FUNCTION replication_wallet_accounts();
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
      await queryInterface.dropTable('wallet_account_caches', { transaction });
      await queryInterface.sequelize.query(
        'DROP TRIGGER WALLET_ACCOUNTS_REPLICATION ON "Wallet_accounts"',
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
