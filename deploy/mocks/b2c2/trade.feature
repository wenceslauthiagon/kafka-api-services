Feature: b2c2 trade mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('trade') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      [
        {
          "trade_id": "#(uuid())",
          "rfq_id": null,
          "order": "#(uuid())",
          "quantity": "0.1000000000",
          "side": "buy",
          "instrument": "BTCUSD.SPOT",
          "price": "56774.00000000",
          "created": "2021-11-24T18:52:35.377877Z",
          "end_client_id": "",
          "client_rfq_id": null,
          "client_order_id": "#(uuid())",
          "user": "demo_bitblue",
          "origin": "rest",
          "executing_unit": ""
        },
        {
          "trade_id": "#(uuid())",
          "rfq_id": null,
          "order": "#(uuid())",
          "quantity": "0.1000000000",
          "side": "buy",
          "instrument": "BTCUSD.SPOT",
          "price": "56791.00000000",
          "created": "2021-11-24T18:51:31.559751Z",
          "end_client_id": "",
          "client_rfq_id": null,
          "client_order_id": "#(uuid())",
          "user": "demo_bitblue",
          "origin": "rest",
          "executing_unit": ""
        },
        {
          "trade_id": "#(uuid())",
          "rfq_id": null,
          "order": "#(uuid())",
          "quantity": "0.1000000000",
          "side": "buy",
          "instrument": "BTCUSD.SPOT",
          "price": "56821.00000000",
          "created": "2021-11-24T18:50:33.458706Z",
          "end_client_id": "",
          "client_rfq_id": null,
          "client_order_id": "#(uuid())",
          "user": "demo_bitblue",
          "origin": "rest",
          "executing_unit": ""
        }
      ]
      """

  Scenario: pathMatches('trade/{trade_id}') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "trade_id": "#(pathParams.trade_id)",
        "rfq_id": null,
        "order": "#(uuid())",
        "client_order_id": "#(uuid())",
        "quantity": "0.0005000000",
        "side": "sell",
        "instrument": "BTCUSD.SPOT",
        "price": "39865.00000000",
        "created": "2022-04-14T18:41:55.163048Z",
        "user": "thatuser",
        "origin": "rest"
      }
      """
