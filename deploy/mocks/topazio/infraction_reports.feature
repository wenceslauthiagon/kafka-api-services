Feature: Topazio infraction report mock server
  Background:
    * def infractionReport = read('infraction_report.json')

  Scenario: pathMatches('topazio/pix-dict/infractionreports') && methodIs('get')
  * def responseStatus = 200
    * def response =
      """
      {
        "infractions": [
              {
                "infractionId": "de671aa0-9023-4a5a-9854-e8888223115e",
                "infractionType": "FRAUD",
                "isReporter": true,
                "ispb": "26264220",
                "operationTransactionId": "8efcc4a8-ce70-40d3-927f-3954c81dbf62",
                "reportDetails": "",
                "analysisDetails": null,
                "analysisResult": null,
                "cancellationDate": null,
                "closingDate": null,
                "creationDate": "2022-02-22T23:28:16.147Z",
                "creditedParticipant": "99999008",
                "debitedParticipant": "26264220",
                "endToEndId": "E26264220202202222026BNJnZ2G4Xci",
                "lastChangeDate": "2022-02-22T23:28:16.147Z",
                "reportedBy": "DEBITED_PARTICIPANT",
                "status": "ACKNOWLEDGED"
              }
          ]
      }
      """ 
  
  Scenario: pathMatches('topazio/pix-dict/infractionreports') && methodIs('post')
    * def responseStatus = 200
    * def response = infractionReport

  Scenario: pathMatches('topazio/pix-dict/infractionreports/{infractionReportId}/cancel') && methodIs('post')
    * def responseStatus = 200
    * infractionReport.infractionReportId = pathParams.infractionReportId
    * def response = infractionReport

  Scenario: pathMatches('topazio/pix-dict/infractionreports/{infractionReportId}/close') && methodIs('post')
  * def responseStatus = 200
  * infractionReport.infractionReportId = pathParams.infractionReportId
  * def response = infractionReport