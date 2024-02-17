Feature: Topazio exchange quotation mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('exchange-quotation/v1/trade') && methodIs('post')
    * def responseStatus = 201
    * def response =
      """
      {
        "resultSet": {
          "id": "#(uuid())",
          "status": 0,
          "operation": "INBOUND",
          "internalSettlementDate": "2022-09-13T17:55:21.581Z",
          "externalSettlementDate": "2022-09-13T17:55:21.581Z",
          "lastAuthorized": 0,
          "createdDate": "2022-09-13T17:55:21.581Z",
          "expiredDate": "2022-09-13T17:55:21.581Z",
          "timeExpired": 300,
          "quotationId": "6320c78b1d3dfc1818938feb",
          "fxRate": 5.2,
          "internalValue": 0,
          "externalValue": 0,
          "partnerId": 0,
          "callbackUrl": "http://url_post_callback_partner/"
        }
      }
      """

  # Get quotation by id "BOLETADO"
  Scenario: pathMatches('exchange-quotation/v1/trade/{id}') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "resultSet": [
          {
            "id": "#(pathParams.id)",
            "status": 5,
            "partnerId": "12345678000123",
            "partner": "ZRO TEST",
            "partnerType": "COMERCIAL",
            "currencyId": 220,
            "internalSettlementDate": "2023-07-18T03:00:00.000Z",
            "externalSettlementDate": "2023-07-18T03:00:00.000Z",
            "operation": "OUTBOUND",
            "currency": "USD",
            "quotationId": "1234567893ec62b790ccd",
            "fxRate": 4.8024,
            "externalValue": 13473.4,
            "internalValue": 64704.66,
            "expiredDate": "2023-07-17T17:49:01.000Z",
            "createdDate": "2023-07-17T17:44:01.000Z",
            "lastAuthorizedBy": 204,
            "lastAuthorizedUser": "test@psp.com.br - CAMBIO TI",
            "partnerOrderId": null,
            "origin": "API",
            "originalPartner": "ZRO TEST",
            "originalPartnerId": "12345678000123"
          }
        ],
        "page": 1,
        "perPage": 100,
        "totalRegisters": 1,
        "totalPages": 1
      }
      """

  Scenario: pathMatches('exchange-quotation/v1/trade/{id}') && methodIs('put')
    * def responseStatus = 200
    * def response =
      """
      {
        "resultSet": "Trade Accepted with success."
      }
      """

  Scenario: pathMatches('exchange-quotation/v1/trade/{id}') && methodIs('delete')
    * def responseStatus = 200
    * def response = {}