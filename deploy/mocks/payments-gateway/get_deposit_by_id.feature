Feature: payments-gateway get deposit by id mock server

    Background:
        * def uuidv4 = function() { return 'c4a9803e-92bb-48e4-b2a4-3655979b70f5' }

    Scenario: pathMatches('/api/transactions/deposit/{id}') && methodIs('get')
        * def responseStatus = 200
        * def response =
            """
            {
                "id": "#(parseInteger(pathParams.id))",
                "reference": "#(uuidv4())",
                "main_transaction": "#(uuidv4())",
                "uuid": "#(uuidv4())",
                "description": "Teste",
                "payment_type": "pix",
                "status": "pending",
                "type_key_pix": "evp",
                "key_pix": "#(uuidv4())",
                "fee_value": "0,00",
                "value": "1,99",
                "created_at": "2022-12-07T20:05:17+00:00",
                "updated_at": "2022-12-07T20:05:17+00:00",
                "transaction_type": "transaction",
                "end_to_end_id_field": null,
                "psp_bank_name": null,
                "psp_ispb": null,
                "company_id": 1,
                "instant_payment_id_field": null,
                "error_description": {
                    "description": null
                },
                "paid_by_client": {
                    "id": 5,
                    "name": "Deanna Padberg",
                    "email": "hal22@sauer.com",
                    "document": "19499648707",
                    "company_id": 1
                },
                "kyc": {
                    "of_legal_age":true,
                    "birthdate":"test",
                    "suspected_death":false,
                    "pep":"test",
                    "age":35
                }
            }
            """