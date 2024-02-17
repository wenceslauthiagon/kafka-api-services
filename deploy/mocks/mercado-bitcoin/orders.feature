Feature: Orders mercado bitcoin mock server


  Scenario: pathMatches('/accounts/{account}/{symbol}/orders/') && methodIs('post')
    * def response =
      """
      {
      "orderId": "100",
      "status": "working"
      }
      """
    * def responseStatus = 200

  Scenario: pathMatches('/accounts/{account}/{symbol}/orders/{orderId}') && methodIs('get')
    * def response =
      """
      {
        "avgPrice": 500,
        "created_at": 1636047578,
        "executions": [
          {
            "executed_at": 1634731027,
            "fee_rate": "0.0005",
            "id": "16",
            "instrument": "BTC-BRL",
            "price": 500,
            "qty": "0.001",
            "side": "buy"
          }
        ],
        "externalId": "1372183",
        "fee": "0.003",
        "filledQty": "0.001",
        "id": "100",
        "instrument": "BTC-BRL",
        "limitPrice": 9997,
        "qty": "0.001",
        "side": "buy",
        "status": "filled",
        "stopPrice": 18000,
        "triggerOrderId": "42",
        "type": "limit",
        "updated_at": 1636047578
      }
      """
    * def responseStatus = 200