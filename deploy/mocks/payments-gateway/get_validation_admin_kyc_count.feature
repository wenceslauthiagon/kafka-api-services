Feature: payments-gateway get validation admin kyc count mock server

    Background:

    Scenario: pathMatches('/api/admin/kyc/count') && methodIs('get')
        * def responseStatus = 200
        * def response =
            """
            {
                "total": 100
            }
            """