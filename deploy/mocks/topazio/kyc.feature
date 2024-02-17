Feature: Topazio kyc mock server

  Background:
    * def kyc_dead_people = read('kyc_dead_people.json')
    * def kyc_people = read('kyc_people.json')
    * def kyc_companies = read('kyc_companies.json')

  Scenario: pathMatches('topazio/bureaus-api/people') && methodIs('post') && request.document == '03340979081'
    * def responseStatus = 200
    * def response = kyc_dead_people

  Scenario: pathMatches('topazio/bureaus-api/people') && methodIs('post') && request.document == '25693346005'
    * def responseStatus = 200
    * def response = {}
    * response.TaxIdNumber = request.document
    * response.TaxIdStatus = "CPF DOES NOT EXIST IN RECEITA FEDERAL DATABASE"
    * response.TaxIdStatusDate = "2022-03-01T13:40:41.2854978Z"

  Scenario: pathMatches('topazio/bureaus-api/people') && methodIs('post')
    * def responseStatus = 200
    * def response = kyc_people
    * response.TaxIdNumber = request.document
    * response.AlternativeIdNumbers.SocialSecurityNumber = request.document

  Scenario: pathMatches('topazio/bureaus-api/companies') && methodIs('post') && request.document == '81018402000115'
    * def responseStatus = 404
    * def response = {}
    * response.type = 'NotFoundError',
    * response.message = 'Not found information for this Document Number'

  Scenario: pathMatches('topazio/bureaus-api/companies') && methodIs('post')
    * def responseStatus = 200
    * def response = kyc_companies
    * response.TaxIdNumber = request.document

 
