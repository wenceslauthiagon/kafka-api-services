Feature: payments-gateway get supports withdraw receipts by id mock server

    Scenario: pathMatches('/api/supports/withdraw-receipts/bank-accounts/{id}') && methodIs('get')
        * def responseStatus = 200
        * def response =
            """
            {
            "base64_receipt": "dummy_withdraw_VGhpcyBpcyBhIG51bWJlciBvZiB0aGUgc3RyaW5nIGJhc2U2NCBpcyBub3QgYSBxdWVzdGlvbiB3aXRob3V0IGFyZSBkZXNpZ25lZCB0byBhIHN0cmluZyBiYXNlNjQu",
            }
            """