'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE FUNCTION insert_crypto_reports_by_operations_btc_receive()
        RETURNS TRIGGER LANGUAGE plpgsql AS
          $$
            DECLARE
              crypto_price BIGINT;
              fiat_amount BIGINT;
              u_id UUID;
              w_id UUID;
              wa_id UUID;
              decimal_id INTEGER;
            BEGIN
              IF NEW.state = 'accepted'
                THEN
                  SELECT uuid FROM "Users" u INTO u_id WHERE NEW.beneficiary_id = u.id;
                  SELECT uuid, wallet_uuid FROM "Wallet_accounts" wa INTO wa_id, w_id WHERE NEW.beneficiary_wallet_id = wa.id;
                  SELECT decimal FROM "Currencies" cur INTO decimal_id WHERE NEW.currency_type_id = cur.id;
                  IF NEW.usd_received_quote <> 0 AND NEW.btc_received_quote <> 0
                    THEN
                      crypto_price := (NEW.usd_received_quote * (NEW.btc_received_quote)/10.^2)::INTEGER;
                      fiat_amount := ((NEW.value /10.^ decimal_id) * crypto_price)::INTEGER;
                  ELSE
                    crypto_price := NULL;
                    fiat_amount := NULL;
                  END IF;

                  INSERT INTO crypto_reports VALUES(
                    uuid_generate_v4(),
                    NULL,
                    'deposit',
                    new.value,
                    crypto_price,
                    false,
                    fiat_amount,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    u_id,
                    NEW.currency_type_id,
                    NULL,
                    NEW.id,
                    wa_id,
                    w_id,
                    NEW.created_at,
                    NEW.updated_at);
              END IF;

              RETURN NEW;
            END;
          $$;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TRIGGER INSERT_CRYPTO_REPORTS_BY_OPERATION_BTC_RECEIVE
        AFTER INSERT ON "Operations_btc_receives"
        FOR EACH ROW EXECUTE PROCEDURE insert_crypto_reports_by_operations_btc_receive();
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE FUNCTION insert_crypto_reports()
        RETURNS TRIGGER LANGUAGE plpgsql AS
          $$
            DECLARE
              crypto_price BIGINT;
              u_id UUID;
              w_id UUID;
              wa_id UUID;
              c_id UUID;
              crypto_referral_price BIGINT;
              c_fiat BIGINT;
              c_type VARCHAR;
              owner_uid UUID;
              beneficiary_uid UUID;
              owner_wid UUID;
              beneficiary_wid UUID;
              decimal_id INTEGER;

              BEGIN
                IF NEW.state = 'accepted'
                  THEN
                    IF NEW.transaction_type_id = 6
                      THEN
                        SELECT uuid FROM "Users" u INTO u_id WHERE NEW.owner_id = u.id;
                        SELECT uuid, wallet_uuid FROM "Wallet_accounts" wa INTO wa_id, w_id WHERE NEW.owner_wallet_id = wa.id;
                        INSERT INTO crypto_reports VALUES(
                          uuid_generate_v4(),
                          NEW.id,
                          'withdraw',
                          NEW.value,
                          NULL,
                          NULL,
                          NULL,
                          NULL,
                          NULL,
                          NULL,
                          NULL,
                          NULL,
                          u_id,
                          NEW.currency_type_id,
                          NULL,
                          NULL,
                          wa_id,
                          w_id,
                          NEW.created_at,
                          NEW.updated_at);
                END IF;
                IF NEW.transaction_type_id IN (29,35)
                  THEN
                    SELECT uuid FROM "Users" u INTO u_id WHERE NEW.beneficiary_id = u.id;
                    SELECT uuid, wallet_uuid FROM "Wallet_accounts" wa INTO wa_id, w_id WHERE NEW.beneficiary_wallet_id = wa.id;
                    SELECT decimal FROM "Currencies" cur INTO decimal_id WHERE NEW.currency_type_id = cur.id;
                    SELECT id,(c.usd_quote * (c.btc_quote::NUMERIC))::INTEGER,((c.btc_amount/10^decimal_id) *(c.usd_quote * (c.btc_quote::NUMERIC))::INTEGER)::INTEGER FROM "Conversions" c INTO c_id, crypto_referral_price,c_fiat  WHERE c.operation_id = NEW.id;
                    INSERT INTO crypto_reports VALUES(
                      uuid_generate_v4(),
                      NEW.id,
                      'cashback',
                      NEW.value,
                      crypto_referral_price,
                      false,
                      c_fiat,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      u_id,
                      NEW.currency_type_id,
                      c_id,
                      NULL,
                      wa_id,
                      w_id,
                      NEW.created_at,
                      NEW.updated_at);
                END IF;

                IF NEW.transaction_type_id = 8
                  THEN
                    SELECT uuid FROM "Users" u INTO owner_uid WHERE NEW.owner_id = u.id;
                    SELECT uuid FROM "Users" u INTO beneficiary_uid WHERE NEW.beneficiary_id = u.id;
                    SELECT uuid, wallet_uuid FROM "Wallet_accounts" wa INTO wa_id, owner_wid WHERE NEW.owner_wallet_id = wa.id;
                    SELECT uuid, wallet_uuid FROM "Wallet_accounts" wa INTO wa_id, beneficiary_wid WHERE NEW.beneficiary_wallet_id = wa.id;
                    INSERT INTO crypto_reports VALUES(
                      uuid_generate_v4(),
                      NEW.id,
                      'withdraw',
                      NEW.value,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      owner_uid,
                      NEW.currency_type_id,
                      NULL,
                      NULL,
                      wa_id,
                      owner_wid,
                      NEW.created_at,
                      NEW.updated_at);

                    INSERT INTO crypto_reports VALUES(
                      uuid_generate_v4(),
                      NEW.id,
                      'deposit',
                      NEW.value,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      beneficiary_uid,
                      NEW.currency_type_id,
                      NULL,
                      NULL,
                      wa_id,
                      beneficiary_wid,
                      NEW.created_at,
                      NEW.updated_at);
                END IF;

                IF NEW.transaction_type_id = 1 AND NEW.currency_type_id = 2
                  THEN
                    SELECT uuid FROM "Users" u INTO owner_uid WHERE NEW.owner_id = u.id;
                    SELECT uuid FROM "Users" u INTO beneficiary_uid WHERE NEW.beneficiary_id = u.id;
                    SELECT uuid, wallet_uuid FROM "Wallet_accounts" wa INTO wa_id, owner_wid WHERE NEW.owner_wallet_id = wa.id;
                    SELECT uuid, wallet_uuid FROM "Wallet_accounts" wa INTO wa_id, beneficiary_wid WHERE NEW.beneficiary_wallet_id = wa.id;
                    INSERT INTO crypto_reports VALUES(
                      uuid_generate_v4(),
                      NEW.id,
                      'withdraw',
                      NEW.value,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      owner_uid,
                      NEW.currency_type_id,
                      NULL,
                      NULL,
                      wa_id,
                      owner_wid,
                      NEW.created_at,
                      NEW.updated_at);

                    INSERT INTO crypto_reports VALUES(
                      uuid_generate_v4(),
                      NEW.id,
                      'deposit',
                      NEW.value,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      beneficiary_uid,
                      NEW.currency_type_id,
                      NULL,
                      NULL,
                      wa_id,
                      beneficiary_wid,
                      NEW.created_at,
                      NEW.updated_at);
                END IF;

                IF NEW.transaction_type_id = 11 and NEW.currency_type_id != 1
                  THEN
                    SELECT uuid FROM "Users" u INTO owner_uid WHERE NEW.owner_id = u.id;
                    SELECT uuid FROM "Users" u INTO beneficiary_uid WHERE NEW.beneficiary_id = u.id;
                    SELECT uuid, wallet_uuid FROM "Wallet_accounts" wa INTO wa_id, owner_wid WHERE NEW.owner_wallet_id = wa.id;
                    SELECT uuid, wallet_uuid FROM "Wallet_accounts" wa INTO wa_id, beneficiary_wid WHERE NEW.beneficiary_wallet_id = wa.id;
                    INSERT INTO crypto_reports VALUES(
                      uuid_generate_v4(),
                      NEW.id,
                      'withdraw',
                      NEW.value,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      owner_uid,
                      NEW.currency_type_id,
                      NULL,
                      NULL,
                      wa_id,
                      owner_wid,
                      NEW.created_at,
                      NEW.updated_at);

                    INSERT INTO crypto_reports VALUES(
                      uuid_generate_v4(),
                      NEW.id,
                      'deposit',
                      NEW.value,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      beneficiary_uid,
                      NEW.currency_type_id,
                      NULL,
                      NULL,
                      wa_id,
                      beneficiary_wid,
                      NEW.created_at,
                      NEW.updated_at);
                  END IF;

                  IF NEW.transaction_type_id IN (36,63) AND NEW.currency_type_id != 1
                    THEN
                      SELECT uuid FROM "Users" u INTO beneficiary_uid WHERE NEW.beneficiary_id = u.id;
                      SELECT uuid, wallet_uuid FROM "Wallet_accounts" wa INTO wa_id, beneficiary_wid WHERE NEW.beneficiary_wallet_id = wa.id;
                      INSERT INTO crypto_reports VALUES(
                        uuid_generate_v4(),
                        NEW.id,
                        'deposit',
                        NEW.value,
                        NULL,
                        NULL,
                        NULL,
                        NULL,
                        NULL,
                        NULL,
                        NULL,
                        NULL,
                        beneficiary_uid,
                        NEW.currency_type_id,
                        NULL,
                        NULL,
                        wa_id,
                        beneficiary_wid,
                        NEW.created_at,
                        NEW.updated_at);
                  END IF;                

                IF NEW.transaction_type_id IN (31,33,62) AND NEW.currency_type_id != 1
                  THEN
                    SELECT uuid FROM "Users" u INTO owner_uid WHERE NEW.owner_id = u.id;
                    SELECT uuid, wallet_uuid FROM "Wallet_accounts" wa INTO wa_id, owner_wid WHERE NEW.owner_wallet_id = wa.id;
                    INSERT INTO crypto_reports VALUES(
                      uuid_generate_v4(),
                      NEW.id,
                      'withdraw',
                      NEW.value,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      NULL,
                      owner_uid,
                      NEW.currency_type_id,
                      NULL,
                      NULL,
                      wa_id,
                      owner_wid,
                      NEW.created_at,
                      NEW.updated_at);
                  END IF;
                END IF;
              RETURN NEW;
            END;
          $$;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TRIGGER INSERT_CRYPTO_REPORTS
        AFTER INSERT OR UPDATE ON "Operations"
        FOR EACH ROW EXECUTE PROCEDURE insert_crypto_reports();
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE FUNCTION insert_crypto_reports_by_conversion()
        RETURNS TRIGGER LANGUAGE plpgsql AS
          $$
            DECLARE
              crypto_price BIGINT;
              u_id UUID;
              w_id UUID;
              wa_id UUID;
              c_fiat BIGINT;
              decimal_id INTEGER;
              cur_id INTEGER;
              o_value BIGINT;

            BEGIN
            IF (SELECT id FROM "Operations" o WHERE NEW.operation_id = o.id and o.transaction_type_id=13 and o.operation_ref_id is not null and o.state='accepted') IS NOT NULL
            THEN
              IF NEW.conversion_type = 'sell'
                THEN
                  SELECT u.uuid FROM "Users" u INTO u_id WHERE NEW.user_id = u.id;
                  SELECT wa.uuid, wa.wallet_uuid FROM "Wallet_accounts" wa JOIN "Operations" o ON o.owner_wallet_id = wa.id INTO wa_id, w_id WHERE NEW.operation_id = o.id;
                  SELECT cur.id, cur.decimal FROM "Currencies" cur JOIN "Operations" o ON o.currency_type_id = cur.id  INTO cur_id, decimal_id WHERE NEW.operation_id = o.id;
                  SELECT ((o2.value)/(o1.value/10.^decimal_id))::INTEGER, o2.value, o1.value from "Operations" o1 join "Operations" o2 on o1.operation_ref_id = o2.id INTO crypto_price, c_fiat, o_value where o1.id = new.operation_id;
                 INSERT INTO crypto_reports VALUES(
                    uuid_generate_v4(),
                    NEW.operation_id,
                    NEW.conversion_type,
                    o_value,
                    crypto_price,
                    true,
                    c_fiat,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    u_id,
                    cur_id,
                    NEW.id,
                    NULL,
                    wa_id,
                    w_id,
                    NEW.created_at,
                    NEW.updated_at);
              ELSE
                  SELECT u.uuid FROM "Users" u INTO u_id WHERE NEW.user_id = u.id;
                  SELECT wa.uuid, wa.wallet_uuid FROM "Wallet_accounts" wa JOIN "Operations" o ON o.beneficiary_wallet_id = wa.id INTO wa_id, w_id WHERE NEW.operation_id = o.id;
                  SELECT cur.id, cur.decimal FROM "Currencies" cur JOIN "Operations" o ON o.currency_type_id = cur.id  INTO cur_id, decimal_id WHERE NEW.operation_id = o.id;
                  SELECT ((o2.value)/(o1.value/10.^decimal_id))::INTEGER, o2.value, o1.value from "Operations" o1 join "Operations" o2 on o1.operation_ref_id = o2.id INTO crypto_price, c_fiat, o_value where o1.id = new.operation_id;
                 INSERT INTO crypto_reports VALUES(
                  uuid_generate_v4(),
                  NEW.operation_id,
                  NEW.conversion_type,
                  o_value,
                  crypto_price,
                  true,
                  c_fiat,
                  NULL,
                  NULL,
                  NULL,
                  NULL,
                  NULL,
                  u_id,
                  cur_id,
                  NEW.id,
                  NULL,
                  wa_id,
                  w_id,
                  NEW.created_at,
                  NEW.updated_at);
              END IF;
            END IF;
              RETURN NEW;
            END;
          $$;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TRIGGER INSERT_CRYPTO_REPORTS_BY_CONVERSION
        AFTER INSERT ON "Conversions"
        FOR EACH ROW EXECUTE PROCEDURE insert_crypto_reports_by_conversion();
        `,
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
      await queryInterface.sequelize.query(
        'DROP TRIGGER INSERT_CRYPTO_REPORTS_BY_OPERATION_BTC_RECEIVE ON "Operations_btc_receives"',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'DROP TRIGGER INSERT_CRYPTO_REPORTS ON "Operations"',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'DROP TRIGGER INSERT_CRYPTO_REPORTS_BY_CONVERSION ON "Conversions"',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'DROP FUNCTION insert_crypto_reports_by_operations_btc_receive()',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'DROP FUNCTION insert_crypto_reports()',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'DROP FUNCTION insert_crypto_reports_by_conversion()',
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
