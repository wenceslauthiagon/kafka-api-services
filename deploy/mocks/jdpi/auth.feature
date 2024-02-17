Feature: Jdpi auth mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('jdpi/auth/jdpi/connect/token') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.access_token = uuid()
    * response.expires_in = (Date.now()/1000) + 3600
    * response.token_type = 'Bearer'
    * response.scope = 'dict_api,qrcode_api,spi_api'
