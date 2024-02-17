Feature: Binance Trade Mock Server

  Background:
    * def cummulativeQuoteQty = function(price, quantity){ return `${(parseFloat(price) * parseFloat(quantity)).toFixed(8).toString()}` }
    * def randomNumber = function(min, max){ return Math.floor(Math.random() * (max - min) + min) }

  Scenario: pathMatches('/api/v3/order') && paramValue('type') == 'LIMIT' && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "symbol": "#(paramValue('symbol'))",
        "orderId": "#(randomNumber(1000000,9999999))",
        "orderListId": -1,
        "clientOrderId": "#(paramValue('newClientOrderId'))",
        "transactTime": "#(paramValue('timestamp'))",
        "price": "#(paramValue('price'))",
        "origQty": "#(paramValue('quantity'))",
        "executedQty": "#(paramValue('quantity'))",
        "cummulativeQuoteQty": "#(cummulativeQuoteQty(paramValue('price') , paramValue('quantity')))",
        "status": "FILLED",
        "timeInForce": "#(paramValue('timeInForce'))",
        "type": "#(paramValue('type'))",
        "side": "#(paramValue('side'))",
        "workingTime": "#(paramValue('timestamp'))",
        "fills": [
          {
            "price": "#(paramValue('price'))",
            "qty": "#(paramValue('quantity'))",
            "commission": "0.00000000",
            "commissionAsset": "BRL",
            "tradeId": "#(randomNumber(1000000,9999999))"
          }
        ],
        "selfTradePreventionMode": "NONE"
      }
      """

  Scenario: pathMatches('/api/v3/order') && paramValue('type') == 'MARKET' && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "symbol": "#(paramValue('symbol'))",
        "orderId": "#(randomNumber(1000000,9999999))",
        "orderListId": -1,
        "clientOrderId": "#(paramValue('newClientOrderId'))",
        "transactTime": "#(paramValue('timestamp'))",
        "price": "0.00000000",
        "origQty": "#(paramValue('quantity'))",
        "executedQty": "#(paramValue('quantity'))",
        "cummulativeQuoteQty": "#(cummulativeQuoteQty(150000, paramValue('quantity')))",
        "status": "FILLED",
        "timeInForce": "GTC",
        "type": "#(paramValue('type'))",
        "side": "#(paramValue('side'))",
        "workingTime": "#(paramValue('timestamp'))",
        "fills": [
          {
            "price": "150000.00000000",
            "qty": "#(paramValue('quantity'))",
            "commission": "0.00000000",
            "commissionAsset": "BTC",
            "tradeId": "#(randomNumber(1000000,9999999))"
          }
        ],
        "selfTradePreventionMode": "NONE"
      }
      """

  Scenario: pathMatches('/api/v3/order') && paramValue('orderId') && paramValue('symbol') && methodIs('delete')
    * def responseStatus = 200
    * def response =
      """
      {
        "symbol": "#(paramValue('symbol'))",
        "origClientOrderId": "fakeCancelOrder",
        "orderId": "#(paramValue('orderId'))",
        "orderListId": -1,
        "clientOrderId": "fakeCancelOrder",
        "transactTime": "#(paramValue('timestamp'))",
        "price": "19622.71000000",
        "origQty": "0.10000000",
        "executedQty": "0.00000000",
        "cummulativeQuoteQty": "0.00000000",
        "status": "CANCELED",
        "timeInForce": "FOK",
        "type": "LIMIT",
        "side": "SELL",
        "selfTradePreventionMode": "NONE"
      }
      """

  Scenario: pathMatches('/api/v3/order') && paramValue('orderId') && paramValue('symbol') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "symbol": "#(paramValue('symbol'))",
        "orderId": "#(paramValue('orderId'))",
        "orderListId": -1,
        "clientOrderId": "fakeGetOrderById",
        "price": "0.00000000",
        "origQty": "0.10000000",
        "executedQty": "0.10000000",
        "cummulativeQuoteQty": "15000.00000",
        "status": "FILLED",
        "timeInForce": "FOK",
        "type": "LIMIT",
        "side": "SELL",
        "stopPrice": "0.00000000",
        "icebergQty": "0.00000000",
        "time": "#(paramValue('timestamp'))",
        "updateTime": "#(paramValue('timestamp'))",
        "isWorking": true,
        "workingTime": "#(paramValue('timestamp'))",
        "origQuoteOrderQty": "0.00000000",
        "selfTradePreventionMode": "NONE"
      }
      """