Feature: Topazio keys mock server

  Background:
    * def translatedPixKey = read('translate-pixkey.json')
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('topazio/pix-dict/entries') && methodIs('post') && request.keyType == 'PHONE' && request.key == '+5581976543210'
    * def responseStatus = 400
    * def response = {}
    * response.type = 'ValidationError'
    * response.errors = [{ code: 0, message: 'Entry in custody of different participant' }]

  Scenario: pathMatches('topazio/pix-dict/entries') && methodIs('post') && request.keyType == 'EMAIL' && request.key == 'owner@zrobank.com.br'
    * def responseStatus = 400
    * def response = {}
    * response.type = 'ValidationError'
    * response.errors = [{ code: 0, message: 'Entry owned by different person' }]

  Scenario: pathMatches('topazio/pix-dict/entries') && methodIs('post') && request.keyType == 'EMAIL' && request.key == 'duplicate@zrobank.com.br'
    * def responseStatus = 400
    * def response = {}
    * response.type = 'ValidationError'
    * response.message = 'Duplicated entry owned by a different person'

  Scenario: pathMatches('topazio/pix-dict/entries') && methodIs('post') && request.keyType == 'EVP'
    * def responseStatus = 200
    * def response = {}
    * response.keyType = request.keyType
    * response.key = uuid()

  Scenario: pathMatches('topazio/pix-dict/entries') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.keyType = request.keyType
    * response.key = request.key

  Scenario: pathMatches('topazio/pix-dict/entries') && methodIs('delete')
    * def responseStatus = 200
    * def response = {}
    * response.keyType = paramValue('keyType')
    * response.key = paramValue('key')

  Scenario: pathMatches('topazio/pix-dict/entries') && methodIs('put')
    * def responseStatus = 200
    * def response = {}
    * response.keyType = paramValue('keyType')
    * response.key = paramValue('key')

  Scenario: pathMatches('topazio/pix-dict/entries') && methodIs('get') && paramValue('key') == 'b3e588d2-45c1-4f5f-a462-df55784c7a07'
    * def responseStatus = 404
    * def response = {}
    * response.type = 'NotFoundError'

  Scenario: pathMatches('topazio/pix-dict/entries') && methodIs('get')
    * def responseStatus = 200
    * def response = translatedPixKey
