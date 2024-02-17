Feature: payments-gateway get dashboard mock server

    Background:

    Scenario: pathMatches('/api/transactions/exports') && methodIs('get')
        * def responseStatus = 200
        * def responseHeaders = { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=exports.csv' }
        * def expectedFileContent = karate.readAsString('./files/exports.csv')
        * def response = expectedFileContent
