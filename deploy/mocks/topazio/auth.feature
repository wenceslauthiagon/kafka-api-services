Feature: Topazio auth mock server

  Background:
    * def EXPIRES_IN = 3600
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('topazio/auth/grant-code') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.redirect_uri = request.redirect_uri + '/?code=' + uuid()

  Scenario: pathMatches('topazio/auth/access-token') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.access_token = uuid()
    * response.refresh_token = uuid()
    * response.expires_in = EXPIRES_IN
