Feature: genial create qrcode dynamic mock server

    Scenario: pathMatches('/v1/authentication') && methodIs('post')
        * def responseStatus = 200
        * def response =
            """
            {
                "token": "4d630166-0646-4813-a4d8-3634383e130c"
            }
            """