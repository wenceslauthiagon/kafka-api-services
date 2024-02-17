Feature: payments-gateway check wallets mock server

    Background:
        * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

    Scenario: pathMatches('/api/wallets/check') && methodIs('get')
        * def responseStatus = 200
        * def response =
            """
            {
                "data": [
                    "#(uuid())",
                    "#(uuid())"
                ]
            }
            """