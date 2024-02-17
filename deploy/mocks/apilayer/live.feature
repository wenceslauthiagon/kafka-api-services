Feature: Stateful apilayer mock server

  Background:
    * def getDate = function(){ return Date.now() / 1000 }
    * def randNumber = function(min, max){ return Math.random() * (max - min) + min }
    * def quotations =
      """
      {
        "USDBRL": 5,
        "BRLUSD": 0.2,
        "EURBRL": 5,
        "BRLEUR": 0.2
      }
      """

  Scenario: pathMatches('live') && methodIs('get') && paramValue('source') == 'BRL' && paramValue('currencies') == 'USD'
    * quotations.BRLUSD = Number(quotations.BRLUSD) + randNumber(0, 0.01)
    * def response =
      """
      {
        "success": "true",
        "terms": "http://localhost/terms",
        "privacy": "http://localhost/terms",
        "timestamp": "#(getDate())",
        "source": "BRL",
        "quotes": {
          "BRLUSD": "#(quotations.BRLUSD)"
        }
      }
      """
    * def responseStatus = 200

  Scenario: pathMatches('live') && methodIs('get') && paramValue('source') == 'USD' && paramValue('currencies') == 'BRL'
    * quotations.USDBRL = Number(quotations.USDBRL) + randNumber(0, 0.01)
    * def response =
      """
      {
        "success": "true",
        "terms": "http://localhost/terms",
        "privacy": "http://localhost/terms",
        "timestamp": "#(getDate())",
        "source": "USD",
        "quotes": {
          "USDBRL": "#(quotations.USDBRL)"
        }
      }
      """
    * def responseStatus = 200

  Scenario: pathMatches('live') && methodIs('get') && paramValue('source') == 'BRL' && paramValue('currencies') == 'USD,EUR'
    * quotations.BRLUSD = Number(quotations.BRLUSD) + randNumber(0, 0.01)
    * quotations.BRLEUR = Number(quotations.BRLEUR) + randNumber(0, 0.01)
    * def response =
      """
      {
        "success": "true",
        "terms": "http://localhost/terms",
        "privacy": "http://localhost/terms",
        "timestamp": "#(getDate())",
        "source": "BRL",
        "quotes": {
          "BRLUSD": "#(quotations.BRLUSD)",
          "BRLEUR": "#(quotations.BRLEUR)"
        }
      }
      """
    * def responseStatus = 200

  Scenario: pathMatches('live') && methodIs('get') && paramValue('source') == 'BRL' && paramValue('currencies') == 'USD,EUR,BTC'
    * quotations.BRLUSD = Number(quotations.BRLUSD) + randNumber(0, 0.01)
    * quotations.BRLEUR = Number(quotations.BRLEUR) + randNumber(0, 0.01)
    * def response =
      """
      {
        "success": "true",
        "terms": "http://localhost/terms",
        "privacy": "http://localhost/terms",
        "timestamp": "#(getDate())",
        "source": "BRL",
        "quotes": {
          "BRLUSD": "#(quotations.BRLUSD)",
          "BRLEUR": "#(quotations.BRLEUR)"
        }
      }
      """
    * def responseStatus = 200

  Scenario: pathMatches('live') && methodIs('get') && paramValue('source') == 'BRL' && paramValue('currencies') == 'USD,EUR,BTC,ETH'
    * quotations.BRLUSD = Number(quotations.BRLUSD) + randNumber(0, 0.01)
    * quotations.BRLEUR = Number(quotations.BRLEUR) + randNumber(0, 0.01)
    * def response =
      """
      {
        "success": "true",
        "terms": "http://localhost/terms",
        "privacy": "http://localhost/terms",
        "timestamp": "#(getDate())",
        "source": "BRL",
        "quotes": {
          "BRLUSD": "#(quotations.BRLUSD)",
          "BRLEUR": "#(quotations.BRLEUR)"
        }
      }
      """
    * def responseStatus = 200

  Scenario: pathMatches('services/send-sms') && methodIs('post')
    * def response =
      """
      {
        "sendSmsResponse": {
          "statusCode": "00",
          "statusDescription": "Ok",
          "detailCode": "000",
          "detailDescription": "Message Sent"
        }
      }
      """
    * def responseStatus = 200
