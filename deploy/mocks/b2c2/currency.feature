Feature: b2c2 currency mock server

  Scenario: pathMatches('currency') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "BTC": {
          "long_only": false,
          "minimum_trade_size": 0.0005,
          "stable_coin": false,
          "currency_type": "crypto",
          "is_crypto": true,
          "readable_name": "Bitcoin"
        },
        "ETH": {
          "long_only": false,
          "minimum_trade_size": 0.005,
          "stable_coin": false,
          "currency_type": "crypto",
          "is_crypto": true,
          "readable_name": "Ether"
        },
        "EUR": {
          "long_only": false,
          "minimum_trade_size": 0.01,
          "stable_coin": false,
          "currency_type": "fiat",
          "is_crypto": false,
          "readable_name": "Euro"
        },
        "USD": {
          "long_only": false,
          "minimum_trade_size": 0.01,
          "stable_coin": false,
          "currency_type": "fiat",
          "is_crypto": false,
          "readable_name": "US Dollar"
        },
        "UST": {
          "long_only": false,
          "minimum_trade_size": 0.01,
          "stable_coin": true,
          "currency_type": "crypto",
          "is_crypto": true,
          "readable_name": "Tether Dollar"
        }
      }
      """
