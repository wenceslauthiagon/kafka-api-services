Feature: payments-gateway get company by id mock server

  Background:
    * def id = function(){ return Math.floor(Math.random() * (10000 - 1)) + 1; }
    * def cnpj = function(){ let numbers = ''; for (let i = 0; i < 14; i++) { numbers += Math.floor(Math.random() * 9);} return numbers; }
    * def phoneNumber = function(){ let numbers = '819'; for (let i = 0; i < 8; i++) { numbers += Math.floor(Math.random() * 9);} return numbers; }
    * def uuidv4 = function() { return 'c4a9803e-92bb-48e4-b2a4-3655979b70f5' }

  Scenario: pathMatches('/api/my-company') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "id": "#(id())",
        "ie": "123123123",
        "name": "MASTER ACCOUNT LTDA",
        "cnpj": "51.658.354/0001-69",
        "phone": "#(phoneNumber())",
        "is_matrix": true,
        "trading_name": "MASTER ACCOUNT",
        "plan_id": 4,
        "responsible_id": 22,
        "wallet_id": "#(uuidv4())",
        "webhook_transaction": null,
        "webhook_withdraw": null,
        "created_at": "2023-02-08T18:23:03+00:00",
        "updated_at": "2023-02-08T19:54:46+00:00",
        "branches": [
          {
            "id": "#(id())",
            "ie": "123123123",
            "name": "SUB ACCOUNT 1",
            "cnpj": "#(cnpj())",
            "phone": "#(phoneNumber())",
            "is_matrix": false,
            "trading_name": "SUB ACCOUNT 1",
            "plan_id": 4,
            "responsible_id": 22,
            "wallet_id": "#(uuidv4())",
            "webhook_transaction": null,
            "webhook_withdraw": null,
            "created_at": "2023-02-08T19:53:53+00:00",
            "updated_at": "2023-02-08T19:54:10+00:00"
          },
          {
            "id": "#(id())",
            "ie": "123123123",
            "name": "SUB ACCOUNT 2",
            "cnpj": "#(cnpj())",
            "phone": "#(phoneNumber())",
            "is_matrix": false,
            "trading_name": "SUB ACCOUNT 2",
            "plan_id": 4,
            "responsible_id": 22,
            "wallet_id": "#(uuidv4())",
            "webhook_transaction": null,
            "webhook_withdraw": null,
            "created_at": "2023-02-08T19:53:09+00:00",
            "updated_at": "2023-02-08T19:54:23+00:00"
          }
        ],
        "bank_accounts": [
          {
            "id": 12,
            "agency": "1",
            "cpf_cnpj": "#(cnpj())",
            "x_api_key": null,
            "chave_pix": "#(uuidv4())",
            "company_id": "#(id())",
            "account_number": "33338888",
            "type_chave_pix": "evp",
            "owner_account_name": "ZRO (MASTER ACCOUNT)",
            "bank_name": "Zro Bank",
            "created_at": "2023-02-09T19:53:05+00:00",
            "updated_at": "2023-02-09T19:53:05+00:00",
            "deleted_at": null,
            "max_withdraw_daily": null,
            "max_withdraw_value_daily_cents": null,
            "max_withdraw_value_monthly_cents": null,
            "active_for_cash_in": true,
            "active_for_cash_out": true
          }
        ],
        "active_bank_for_cash_in": {
          "id": 12,
          "agency": "1",
          "cpf_cnpj": "#(cnpj())",
          "x_api_key": null,
          "chave_pix": "#(uuidv4())",
          "company_id": 17,
          "account_number": "33338888",
          "type_chave_pix": "evp",
          "owner_account_name": "ZRO (MASTER ACCOUNT)",
          "bank_name": "Zro Bank",
          "created_at": "2023-02-09T19:53:05+00:00",
          "updated_at": "2023-02-09T19:53:05+00:00",
          "deleted_at": null,
          "max_withdraw_daily": null,
          "max_withdraw_value_daily_cents": null,
          "max_withdraw_value_monthly_cents": null,
          "active_for_cash_in": true,
          "active_for_cash_out": true
        },
        "active_bank_for_cash_out": {
          "id": 12,
          "agency": "1",
          "cpf_cnpj": "#(cnpj())",
          "x_api_key": null,
          "chave_pix": "#(uuidv4())",
          "company_id": 17,
          "account_number": "33338888",
          "type_chave_pix": "evp",
          "owner_account_name": "ZRO (MASTER ACCOUNT)",
          "bank_name": "Zro Bank",
          "created_at": "2023-02-09T19:53:05+00:00",
          "updated_at": "2023-02-09T19:53:05+00:00",
          "deleted_at": null,
          "max_withdraw_daily": null,
          "max_withdraw_value_daily_cents": null,
          "max_withdraw_value_monthly_cents": null,
          "active_for_cash_in": true,
          "active_for_cash_out": true
        }
      }
      """