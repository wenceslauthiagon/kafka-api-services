Feature: b2c2 balance mock server

  Background:
    * def randNumber = function(min, max){ return `${Math.floor(Math.random() * (max - min)) + min}.0000` }

  Scenario: pathMatches('balance') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "BTC": "#(randNumber(1, 20))",
        "USD": "#(randNumber(500, 10000))",
        "ADA": "0",
        "AUD": "0",
        "AVX": "0",
        "BCH": "0",
        "BNB": "0",
        "CHF": "0",
        "CMP": "0",
        "CNH": "0",
        "DAI": "0",
        "DOG": "0",
        "DOT": "0",
        "EOS": "0",
        "ETC": "0"
      }
      """
