Feature: Dock banks mock server

  Background:
    * def banks = read('banks.json')

  Scenario: pathMatches('bancos') && methodIs('get')
    * def responseStatus = 200
    * def response = banks
