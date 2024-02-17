Feature: Authorize mercado bitcoin mock server

  Scenario: pathMatches('authorize') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
      "access_token": "AAAAAAAAAAAAAAAAAAAAAFnz2wAAAAAACOwLSPtVT5gxxxxxxxxxxxx",
      "expiration": 1634220858
      }
      """