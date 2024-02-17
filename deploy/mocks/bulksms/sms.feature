Feature: Stateful bulksms mock server

  Scenario: pathMatches('/messages') && methodIs('post') && request.to == '+5581987654321'
    * def response =
      """
      {
        id: "1234567890",
        type: 'SENT',
        "to": "+5581987654321",
        "body": "Body Mock Karate",
        "status": {
          "id": "FAILED.NOT_SENT",
          "type": "FAILED",
          "subtype": "NOT_SENT",
        },
      }
      """
    * response.body = request.body
    * def responseStatus = 201

  Scenario: pathMatches('/messages') && methodIs('post')
    * def response =
      """
        {
          id: "1234567890",
          type: 'SENT',
          "to": "+5581987654321",
          "body": "Body Mock Karate",
          "status": {
            "id": "SENT.null",
            "type": "SENT",
            "subtype": null,
          },
        }
      """
    * response.body = request.body
    * response.to = request.to
    * def responseStatus = 201
