Feature: b2c2 account info mock server

  Scenario: pathMatches('account_info') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "max_risk_exposure": "5000000",
        "risk_exposure": "496594.48",
        "currency": "USD",
        "btc_max_qty_per_trade": "200"
      }
      """
