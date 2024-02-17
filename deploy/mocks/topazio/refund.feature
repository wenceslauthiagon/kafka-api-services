Feature: Topazio refund report mock server

  Background:
    * def uuid = function(){ return java.util.UUID.randomUUID() + '' }

  Scenario: pathMatches('topazio/pix-dict/refunds') && methodIs('put')
    * def responseStatus = 200
    * def response = {}
    * response.solicitationId = uuid()
    * response.status = 'CLOSED'

  Scenario: pathMatches('topazio/pix-dict/refunds') && methodIs('get') && paramValue('status') == 'OPEN'
    * def responseStatus = 200
    * def response =
      """
      {
        "refunds": [
          {
            "transactionId": "2517b6d3-33e7-4d56-92c6-1d598be784fb",
            "contested": false,
            "endToEndId": "E262642202023031411561gSJ7oXLFsz",
            "refundAmount": 12.18,
            "refundDetails": "",
            "refundReason": "OPERATIONAL_FLAW",
            "refundType": "REQUESTING",
            "requesterIspb": "26264220",
            "responderIspb": "07679404",
            "status": "OPEN",
            "creationDate": "2023-03-16T12:39:46.384Z",
            "devolutionId": "",
            "infractionId": "",
            "lastChangeDate": "2023-03-16T12:39:46.384Z",
            "solicitationId": "2517b6d3-33e7-4d56-92c6-1d598be784fb",
            "isInternalRefund": true
          }
        ]
      }
      """ 

  Scenario: pathMatches('topazio/pix-dict/refunds') && methodIs('get') && paramValue('status') == 'CLOSED'
    * def responseStatus = 404
    * def response =
      """
      {
        "type": "NotFoundError",
        "message": "Refunds not found"
      }
      """
  