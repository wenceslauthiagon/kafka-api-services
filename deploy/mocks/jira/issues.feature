Feature: Jira issues mock server

  Background:
    * def id = function(){ return Math.floor(Math.random() * (10000 - 1)) + 1; }

  Scenario: pathMatches('rest/api/2/issue') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.id = id()
    * response.key = 'ISSUE-' + response.id

  Scenario: pathMatches('rest/api/2/issue/{id}') && methodIs('put')
    * def responseStatus = 200

  Scenario: pathMatches('rest/api/2/issue/{id}/transitions') && methodIs('post')
    * def responseStatus = 200

    Scenario: pathMatches('rest/api/2/issue/{id}/comment') && methodIs('post')
    * def responseStatus = 200
