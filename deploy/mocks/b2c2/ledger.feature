Feature: b2c2 ledger mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('ledger') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      [
        {
          "transaction_id": "#(uuid())",
          "created": "2022-05-04T23:02:16.398668Z",
          "reference": "#(uuid())",
          "currency": "USD",
          "amount": "19.8215000000000000",
          "type": "trade",
          "group": "trading"
        },
        {
          "transaction_id": "#(uuid())",
          "created": "2022-05-04T23:02:16.398668Z",
          "reference": "#(uuid())",
          "currency": "BTC",
          "amount": "-0.0005000000000000",
          "type": "trade",
          "group": "trading"
        },
        {
          "transaction_id": "#(uuid())",
          "created": "2022-05-04T23:02:00.784977Z",
          "reference": "#(uuid())",
          "currency": "USD",
          "amount": "19.8235000000000000",
          "type": "trade",
          "group": "trading"
        },
        {
          "transaction_id": "#(uuid())",
          "created": "2022-05-04T23:02:00.784977Z",
          "reference": "#(uuid())",
          "currency": "BTC",
          "amount": "-0.0005000000000000",
          "type": "trade",
          "group": "trading"
        }
      ]
      """
