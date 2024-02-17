Feature: payments-gateway get refunds mock server

    Background:
        * def id = function(){ return Math.floor(Math.random() * (10000 - 1)) + 1; }
        * def uuidv4 = function() { return 'c4a9803e-92bb-48e4-b2a4-3655979b70f5' }
        * def cnpj = function(){ let numbers = ''; for (let i = 0; i < 14; i++) { numbers += Math.floor(Math.random() * 9);} return numbers; }

    Scenario: pathMatches('/api/transactions/refunds') && methodIs('get')
        * def responseStatus = 200
        * def response =
            """
            {
                "data": [
                    {
                        "id": "#(id())",
                        "reference": "#(uuidv4())",
                        "main_transaction": "#(uuidv4())",
                        "uuid": "#(uuidv4())",
                        "description": "Teste",
                        "payment_type": "pix",
                        "status": "pending",
                        "type_key_pix": "EVP",
                        "key_pix": "#(uuidv4())",
                        "fee_value": "0,00",
                        "value": "1,99",
                        "created_at": "2022-12-07T20:05:17+00:00",
                        "updated_at": "2022-12-07T20:05:17+00:00",
                        "transaction_type": "refund",
                        "end_to_end_id_field": null,
                        "psp_bank_name": null,
                        "psp_ispb": null,
                        "company_id": 1,
                        "instant_payment_id_field": null,
                        "error_description": {
                            "description": null
                        },
                        "bank": {
                            "id": 6,
                            "agency": "0001",
                            "cpf_cnpj": "#(cnpj())",
                            "x_api_key": "banco01",
                            "chave_pix": "#(uuidv4())",
                            "company_id": 1,
                            "account_number": "9083908",
                            "type_chave_pix": "EVP",
                            "owner_account_name": "Conta 01",
                            "bank_name": "Banco 01",
                            "created_at": "2022-10-20T20:35:11+00:00",
                            "updated_at": "2022-11-25T17:36:43+00:00",
                            "deleted_at": null,
                            "max_withdraw_daily": null,
                            "max_withdraw_value_daily_cents": null,
                            "max_withdraw_value_monthly_cents": null,
                            "active_for_cash_in": true,
                            "active_for_cash_out": true
                        },
                        "company": {
                            "id": 1,
                            "ie": "1111111",
                            "name": "Loja 1",
                            "cnpj": "51.658.354/0001-69",
                            "phone": "(99) 99999-9999",
                            "is_matrix": true,
                            "trading_name": "Loja 1",
                            "plan_id": 1,
                            "responsible_id": 1,
                            "wallet_id": "#(uuidv4())",
                            "webhook_transaction": "https://teste.com.br/api\\/webhook\\/deposit",
                            "webhook_withdraw": "https://teste.com.br/api\\/webhook\\/withdraw",
                            "created_at": "2022-04-20T01:06:17+00:00",
                            "updated_at": "2022-12-28T14:48:34+00:00"
                        }
                    }
                ],
                "links": {
                    "first": "http://localhost:81/api/transactions/deposit?page=1",
                    "last": "http://localhost:81/api/transactions/deposit?page=3",
                    "prev": null,
                    "next": "http://localhost:81/api/transactions/deposit?page=2"
                },
                "meta": {
                    "current_page": 1,
                    "from": 1,
                    "last_page": 29,
                    "links": [
                        {
                            "url": null,
                            "label": "&laquo; Previous",
                            "active": false
                        },
                        {
                            "url": "http://localhost:81/api/transactions/deposit?page=1",
                            "label": "1",
                            "active": true
                        },
                        {
                            "url": "http://localhost:81/api/transactions/deposit?page=2",
                            "label": "2",
                            "active": false
                        },
                        {
                            "url": "http://localhost:81/api/transactions/deposit?page=3",
                            "label": "3",
                            "active": false
                        }
                    ],
                    "path": "http://localhost:81/api/transactions/deposit",
                    "per_page": 15,
                    "to": 15,
                    "total": 435
                }
            }
            """