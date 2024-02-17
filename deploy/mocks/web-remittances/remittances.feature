Feature: Stateful Remittances mock server

  Background:
    * def providers = read('providers.json')
    * def remittances =
      """
      read('remittances.json').reduce((acc, item) => {
      item.provider = providers[item.provider_id]
      delete item.provider_id
      acc[item.id] = item
      return acc
      }, {})
      """
    * def getRemittancesByFilters =
      """
      function(status){
      const result = Object.values(remittances)
      if (status) return result.filter((item) => item.status === status)
      return result
      }
      """

  Scenario: pathMatches('/remittances') && methodIs('get')
    * def response = getRemittancesByFilters(paramValue('status'))
    * def responseStatus = 200

  Scenario: pathMatches('/remittances/{id}') && methodIs('get')
    * def response = remittances[pathParams.id]
    * def responseStatus = response ? 200 : 404
