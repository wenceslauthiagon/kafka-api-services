Feature: Topazio claims mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('topazio/pix-dict/claims') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.keyType = request.keyType
    * response.key = request.key

  Scenario: pathMatches('topazio/pix-dict/claims/confirm') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.keyType = request.keyType
    * response.key = request.key
    * response.returnCode = 0

  Scenario: pathMatches('topazio/pix-dict/claims/cancel') && methodIs('post')
    * def responseStatus = 200
    * def response = {}
    * response.keyType = request.keyType
    * response.key = request.key
    * response.returnCode = 0

  Scenario: pathMatches('topazio/pix-dict/claims') && methodIs('get')
    * def responseStatus = 200
    * def response =
      """
      {
        "claims": [
          {
            "requestId": "#(uuid())",
            "accountNumber": "2184370",
            "accountOpeningDate": null,
            "accountType": "CACC",
            "branch": "3728",
            "claimReason": "DEFAULT_OPERATION",
            "claimType": "OWNERSHIP",
            "document": "11186124008",
            "donation": false,
            "donorIspb": "26264220",
            "endCompleteDate": "#(new Date().toISOString())",
            "endResolutionDate": "#(new Date().toISOString())",
            "ispb": "26264220",
            "key": "manoelsilva@email.com.br",
            "keyType": "EMAIL",
            "lastChangeDate": "#(new Date().toISOString())",
            "name": "JOAO MANOEL DA SILVA",
            "personType": "NATURAL_PERSON",
            "requestIspb": "60746948",
            "status": "OPEN",
            "tradeName": null
          },
          {
            "requestId": "#(uuid())",
            "accountNumber": "66627027",
            "accountOpeningDate": null,
            "accountType": "CACC",
            "branch": "0001",
            "claimReason": "USER_REQUESTED",
            "claimType": "OWNERSHIP",
            "document": "11186124008",
            "donation": true,
            "donorIspb": "00416968",
            "endCompleteDate": "#(new Date().toISOString())",
            "endResolutionDate": "#(new Date().toISOString())",
            "ispb": "26264220",
            "key": "chicodantas@email.com",
            "keyType": "EMAIL",
            "lastChangeDate": "#(new Date().toISOString())",
            "name": "FRANCISCO DANTAS",
            "personType": "NATURAL_PERSON",
            "requestIspb": null,
            "status": "WAITING_RESOLUTION",
            "tradeName": null
          }
        ]
      }
      """