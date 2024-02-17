Feature: Stateful Remittances mock server

  Background:
    * def providers = read('providers.json')

  Scenario: pathMatches('/providers') && methodIs('get')
    * def response = $providers.*
    * def responseStatus = 200

  Scenario: pathMatches('/providers/{id}') && methodIs('get')
    * def response = providers[pathParams.id]
    * def responseStatus = response ? 200 : 404
