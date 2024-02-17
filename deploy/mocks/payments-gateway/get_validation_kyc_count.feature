Feature: payments-gateway get validation kyc count mock server

    Background:

    Scenario: pathMatches('/api/kyc/count') && methodIs('get')
        * def responseStatus = 200
        * def response =
            """
            [
                {
                    "total_items": 100
                }
            ]
            """