Feature: Topazio devolution mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('topazio/pix-transactions/devolutions') && methodIs('post')
    * def responseStatus = 201
    * def response =
      """
      {
        "transactionId": "#(uuid())"
      }
      """
