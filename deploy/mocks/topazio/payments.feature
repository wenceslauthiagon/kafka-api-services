Feature: Topazio payment mock server

  Background:
    * def payment = read('payment.json')
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('topazio/pix-transactions/payments') && methodIs('post')
    * def responseStatus = 201
    * def response = {}
    * response.transactionId = uuid()

  Scenario: pathMatches('topazio/pix-transactions/payments/{transactionId}') && methodIs('get')
    * def responseStatus = 200
    * payment.transactionId = pathParams.transactionId
    * def response = payment

  Scenario: pathMatches('topazio/pix-transactions/payments') && methodIs('post') && request.thirdPartIspb == '30680829'
    * def responseStatus = 400
    * def response = {}
    * response.type = 'ValidationError'
    * response.errors = [{ code: 0, message: 'ISPB disabled' }]

