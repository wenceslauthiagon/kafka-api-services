Feature: payments-gateway get validation client kyc count mock server

    Background:

    Scenario: pathMatches('/api/client/kyc/count') && methodIs('get')
        * def responseStatus = 200
        * def response =
            """
            {
                "total": 100
            }
            """