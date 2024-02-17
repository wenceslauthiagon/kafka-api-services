Feature: b2c2 instruments mock server

  Scenario: pathMatches('instruments') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      [
        {
          "name": "BTCUSD.SPOT",
          "underlier": "BTCUSD",
          "type": "SPOT",
          "is_tradable": true,
          "quantity_precision": 0.0001,
          "max_quantity_per_trade": 200,
          "min_quantity_per_trade": 0.0005,
          "price_significant_digits": 5
        },
        {
          "name": "ETHUSD.SPOT",
          "underlier": "ETHUSD",
          "type": "SPOT",
          "is_tradable": true,
          "quantity_precision": 0.0001,
          "max_quantity_per_trade": 3000,
          "min_quantity_per_trade": 0.005,
          "price_significant_digits": 5
        },
        {
          "name": "EURUSD.SPOT",
          "underlier": "EURUSD",
          "type": "SPOT",
          "is_tradable": true,
          "quantity_precision": 0.0001,
          "max_quantity_per_trade": 500000,
          "min_quantity_per_trade": 0.01,
          "price_significant_digits": 5
        },
        {
          "name": "BTCUST.SPOT",
          "underlier": "BTCUST",
          "type": "SPOT",
          "is_tradable": true,
          "quantity_precision": 0.0001,
          "max_quantity_per_trade": 200,
          "min_quantity_per_trade": 0.0005,
          "price_significant_digits": 5
        },
        {
          "name": "USTUSD.SPOT",
          "underlier": "USTUSD",
          "type": "SPOT",
          "is_tradable": true,
          "quantity_precision": 0.0001,
          "max_quantity_per_trade": 600000,
          "min_quantity_per_trade": 0.01,
          "price_significant_digits": 5
        }
      ]
      """
