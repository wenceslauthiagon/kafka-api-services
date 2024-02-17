Feature: Symbols mercado bitcoin mock server

  Scenario: pathMatches('symbols') && methodIs('get')
    * def response =
      """
      {
        "symbol": ["BTC-BRL", "ETH-BRL", "DOGE-BRL", "ADA-BRL", "USDC-BRL"],
        "description": ["Bitcoin", "Ethereum", "Dogecoin", "Cardano", "USD Coin"],
        "currency": ["BRL", "BRL", "BRL", "BRL", "BRL"],
        "base-currency": ["BTC", "ETH", "DOGE", "ADA", "USDC"],
        "exchange-listed": [true, true, true, true, true],
        "exchange-traded":  [true, true, true, true, true],
        "minmovement": ["1", "1", "1", "1", "0.01"],
        "pricescale":[100000000, 100000000, 100000000, 100000000, 100000000],
        "type": ["CRYPTO", "CRYPTO", "CRYPTO", "CRYPTO", "CRYPTO"],
        "timezone": ["America/Sao_Paulo", "America/Sao_Paulo", "America/Sao_Paulo", "America/Sao_Paulo", "America/Sao_Paulo"],
        "session-regular": ["24x7", "24x7", "24x7", "24x7", "24x7"],
        "withdrawal-fee": ["", "0.01", "", "1", "25"]
      }
      """
    * def responseStatus = 200