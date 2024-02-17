Feature: Stateful Remittances mock server

  Background:
    * def providers = read('providers.json')
    * def conversions =
      """
      read('conversions.json').reduce((acc, item) => {
      item.provider = providers[item.provider_id]
      delete item.provider_id
      acc[item.id] = item
      return acc
      }, {})
      """
    * def getConversionsByFilters =
      """
      function(provider_id){
      const result = Object.values(conversions)
      if (provider_id) return result.filter((item) => item.provider.id === provider_id)
      return result
      }
      """

  Scenario: pathMatches('/conversions') && methodIs('get')
    * def response = getConversionsByFilters(paramValue('provider_id'))
    * def responseStatus = 200

  Scenario: pathMatches('/conversions/{id}') && methodIs('get')
    * def response = conversions[pathParams.id]
    * def responseStatus = response ? 200 : 404
