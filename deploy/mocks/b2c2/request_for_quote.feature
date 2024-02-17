Feature: b2c2 request for quote mock server

  Background:
    * def getDate = function(){ return new Date().toISOString() }
    * def uuid = function(){ return java.util.UUID.randomUUID() }
    * def randNumber = function(min, max){ return `${Math.floor(Math.random() * (max - min)) + min}.00000000` }

  Scenario: pathMatches('request_for_quote') && methodIs('post')
    * def responseStatus = 200
    * def response =
      """
      {
        "rfq_id": "#(uuid())",
        "client_rfq_id": "#(request.client_rfq_id)",
        "quantity": "#(request.quantity)",
        "side": "#(request.side)",
        "instrument": "#(request.instrument)",
        "price": "#(randNumber(18000, 21000))",
        "created": "#(getDate())"
      }
      """
