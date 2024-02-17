Feature: b2c2 order mock server

  Background:
    * def getDate = function(){ return new Date().toISOString() }
    * def uuid = function(){ return java.util.UUID.randomUUID() }
    * def randNumber = function(min, max){ return `${Math.floor(Math.random() * (max - min)) + min}.00000000` }

  Scenario: pathMatches('order') && methodIs('post') && request.order_type == 'MKT'
    * def responseStatus = 200
    * def response =
      """
      {
        "order_id": "#(uuid())",
        "client_order_id": "#(request.client_order_id)",
        "instrument": "#(request.instrument)",
        "price": null,
        "executed_price": "#(randNumber(29000, 31000))",
        "quantity": "#(request.quantity)",
        "side": "#(request.side)",
        "order_type": "#(request.order_type)",
        "created": "#(getDate())",
        "executing_unit": "",
        "trades": [
          {
            "trade_id": "#(uuid())",
            "rfq_id": null,
            "cfd_contract": null,
            "order": "#(uuid())",
            "quantity": "#(request.quantity)",
            "side": "#(request.side)",
            "instrument": "#(request.instrument)",
            "price": null,
            "created": "#(getDate())",
            "origin": "rest",
            "executing_unit": ""
          }
        ]
      }
      """

  Scenario: pathMatches('order') && methodIs('post') && request.order_type == 'FOK'
    * def responseStatus = 200
    * def response =
      """
      {
        "order_id": "#(uuid())",
        "client_order_id": "#(request.client_order_id)",
        "instrument": "#(request.instrument)",
        "price": "#(request.price)",
        "executed_price": "#(request.price)",
        "quantity": "#(request.quantity)",
        "side": "#(request.side)",
        "order_type": "#(request.order_type)",
        "created": "#(getDate())",
        "executing_unit": "",
        "trades": [
          {
            "trade_id": "#(uuid())",
            "rfq_id": null,
            "cfd_contract": null,
            "order": "#(uuid())",
            "quantity": "#(request.quantity)",
            "side": "#(request.side)",
            "instrument": "#(request.instrument)",
            "price": "#(request.price)",
            "created": "#(getDate())",
            "origin": "rest",
            "executing_unit": ""
          }
        ]
      }
      """

  Scenario: pathMatches('order/{order_id}') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      [
        {
          "order_id": "#(pathParams.order_id)",
          "client_order_id": "#(uuid())",
          "instrument": "BTCUSD.SPOT",
          "price": "#(randNumber(18000, 21000))",
          "executed_price": "#(randNumber(18000, 21000))",
          "quantity": "0.0005000000",
          "side": "sell",
          "order_type": "FOK",
          "created": "#(getDate())",
          "trades": [
            {
              "trade_id": "#(uuid())",
              "rfq_id": null,
              "cfd_contract": null,
              "order": "#(pathParams.order_id)",
              "quantity": "0.0005000000",
              "side": "sell",
              "instrument": "BTCUSD.SPOT",
              "price": "#(randNumber(18000, 21000))",
              "created": "#(getDate())",
              "origin": "rest",
              "executing_unit": ""
            }
          ]
        }
      ]
      """

  Scenario: pathMatches('order') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      [
        {
          "order_id": "#(uuid())",
          "client_order_id": "#(uuid())",
          "instrument": "BTCUSD.SPOT",
          "price": "#(randNumber(18000, 21000))",
          "executed_price": "#(randNumber(18000, 21000))",
          "quantity": "0.0005000000",
          "side": "sell",
          "order_type": "FOK",
          "created": "#(getDate())",
          "executing_unit": ""
        },
        {
          "order_id": "#(uuid())",
          "client_order_id": "#(uuid())",
          "instrument": "BTCUSD.SPOT",
          "price": "#(randNumber(18000, 21000))",
          "executed_price": "#(randNumber(18000, 21000))",
          "quantity": "0.0006000000",
          "side": "sell",
          "order_type": "FOK",
          "created": "#(getDate())",
          "executing_unit": ""
        }
      ]
      """
