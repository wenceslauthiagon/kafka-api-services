Feature: Dock banks mock server

  Scenario: pathMatches('oauth2/token') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "access_token": "token",
        "expires_in": 600000
      }
      """
