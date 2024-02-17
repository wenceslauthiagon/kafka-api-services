Feature: Topazio qrcode mock server

  Background:
    * def translatedQrCode = read('translate-qrcode.json')
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('topazio/pix-transactions/qrcode/static-payments') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.emv = '00020126830014br.gov.bcb.pix01364004901d-bd85-4769-8e52-cb4c42c506dc0221Jornada pagador 902455204000053039865406269.445802BR5903Pix6008BRASILIA62290525eee44af2980b4d5c9d2d2981c6304A9D6'
    * response.txId = uuid()

  Scenario: pathMatches('topazio/pix-transactions/qrcode/{txId}') && methodIs('delete')
    * def responseStatus = pathParams.txId ? 204 : 400

  Scenario: pathMatches('topazio/pix-transactions/query/translate-qrcode') && methodIs('get')
    * def responseStatus = 200
    * def response = translatedQrCode

  Scenario: pathMatches('topazio/pix-transactions/qrcode/dynamic-payments') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.emv = '00020126830014br.gov.bcb.pix01364004901d-bd85-4769-8e52-cb4c42c506dc0221Jornada pagador 902455204000053039865406269.445802BR5903Pix6008BRASILIA62290525eee44af2980b4d5c9d2d2981c6304A9D6'
    * response.txId = uuid()
